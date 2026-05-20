import React, { useEffect, useRef, useState } from "react";
import { Box, Text, Spinner } from "zmp-ui";
import { API_BASE_URL } from "@constants/common";

interface CameraStreamProps {
  rtspUrl: string;
}

/** Phát video livestream từ RTSP qua go2rtc MSE WebSocket */
const CameraStream: React.FC<CameraStreamProps> = ({ rtspUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const msRef = useRef<MediaSource | null>(null);
  const sbRef = useRef<SourceBuffer | null>(null);
  const bufferQueue = useRef<ArrayBuffer[]>([]);

  const [status, setStatus] = useState<"connecting" | "playing" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [go2rtcUrl, setGo2rtcUrl] = useState<string | null>(null);

  /** Fetch go2rtc URL từ backend khi mount hoặc retry */
  useEffect(() => {
    let cancelled = false;
    setStatus("connecting");
    setErrorMsg("");

    fetch(`${API_BASE_URL}/api/config/go2rtc`)
      .then((res) => {
        if (!res.ok) throw new Error("GO2RTC_URL chưa được cấu hình trên server");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setGo2rtcUrl(data.url);
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(`Không thể lấy URL go2rtc: ${err.message}`);
        }
      });

    return () => { cancelled = true; };
  }, [retryKey]);

  /** Kết nối WebSocket tới go2rtc và khởi tạo MSE pipeline */
  useEffect(() => {
    if (!rtspUrl || !go2rtcUrl) return;

    const video = videoRef.current;
    if (!video) return;

    if (!("MediaSource" in window)) {
      setStatus("error");
      setErrorMsg("Trình duyệt không hỗ trợ MediaSource");
      return;
    }

    let ws: WebSocket;
    let ms: MediaSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      setStatus("connecting");
      setErrorMsg("");

      const activeUrl = (() => {
        if (go2rtcUrl.includes("localhost") || go2rtcUrl.includes("127.0.0.1")) {
          const hostname = window.location.hostname;
          const isLocalIp = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname);
          if (isLocalIp) {
            return go2rtcUrl.replace("localhost", hostname).replace("127.0.0.1", hostname);
          }
        }
        return go2rtcUrl;
      })();

      const wsBase = activeUrl.replace(/^http/, "ws");
      const wsUrl = `${wsBase}/api/ws?src=${encodeURIComponent(rtspUrl)}`;

      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.binaryType = "arraybuffer";
      } catch (e: any) {
        setStatus("error");
        setErrorMsg(`Không thể tạo kết nối WebSocket: ${e?.message || e}`);
        return;
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "mse" }));
      };

      ws.onmessage = (ev) => {
        if (typeof ev.data === "string") {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "mse") {
              ms = new MediaSource();
              msRef.current = ms;
              video.src = URL.createObjectURL(ms);

              ms.addEventListener("sourceopen", () => {
                try {
                  const sb = ms.addSourceBuffer(msg.value);
                  sbRef.current = sb;
                  sb.mode = "segments";

                  /** Xử lý hàng đợi buffer và giới hạn bộ nhớ */
                  sb.addEventListener("updateend", () => {
                    if (bufferQueue.current.length > 0 && !sb.updating) {
                      const next = bufferQueue.current.shift();
                      if (next) {
                        try { sb.appendBuffer(next); } catch (e) {}
                      }
                    }

                    if (video.buffered.length > 0 && video.buffered.end(0) - video.buffered.start(0) > 30) {
                      try { sb.remove(0, video.buffered.end(0) - 10); } catch (e) {}
                    }
                  });

                  setStatus("playing");
                  video.play().catch(() => {});
                } catch (e) {
                  setStatus("error");
                  setErrorMsg("Codec không được hỗ trợ: " + msg.value);
                }
              });
            } else if (msg.type === "error") {
              setStatus("error");
              setErrorMsg(msg.value || "Lỗi từ go2rtc server");
            }
          } catch (e) {}
        } else {
          const sb = sbRef.current;
          if (sb && !sb.updating) {
            try {
              sb.appendBuffer(ev.data);
            } catch (e) {
              bufferQueue.current.push(ev.data);
              if (bufferQueue.current.length > 50) bufferQueue.current.shift();
            }
          } else {
            bufferQueue.current.push(ev.data);
            if (bufferQueue.current.length > 50) bufferQueue.current.shift();
          }
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMsg("Không thể kết nối go2rtc server. Kiểm tra go2rtc đang chạy.");
      };

      ws.onclose = (ev) => {
        if (ev.code !== 1000) {
          setStatus("error");
          setErrorMsg("Mất kết nối. Đang thử kết nối lại...");
          retryTimeout = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimeout);
      bufferQueue.current = [];

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      if (msRef.current && msRef.current.readyState === "open") {
        try { msRef.current.endOfStream(); } catch (e) {}
      }

      sbRef.current = null;
      msRef.current = null;

      if (videoRef.current) {
        videoRef.current.src = "";
      }
    };
  }, [rtspUrl, go2rtcUrl]);

  /** Đồng bộ video với live edge, nhảy lên nếu trễ > 3s */
  useEffect(() => {
    if (status !== "playing") return;
    const video = videoRef.current;
    if (!video) return;

    const interval = setInterval(() => {
      if (video.buffered.length > 0) {
        const liveEdge = video.buffered.end(video.buffered.length - 1);
        if (liveEdge - video.currentTime > 3) {
          video.currentTime = liveEdge - 0.5;
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <Box
      flex
      flexDirection="column"
      style={{
        backgroundColor: "#1a1a1a",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
        minHeight: 200,
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: "100%",
          height: "auto",
          minHeight: 200,
          maxHeight: 300,
          objectFit: "contain",
          backgroundColor: "#000",
          display: status === "playing" ? "block" : "none",
        }}
        onClick={(e) => {
          const v = e.currentTarget;
          v.muted = !v.muted;
        }}
      />

      {status === "connecting" && (
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ height: 200 }}
        >
          <Spinner />
          <Text style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
            Đang kết nối camera...
          </Text>
        </Box>
      )}

      {status === "error" && (
        <Box
          flex
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          style={{ height: 200, padding: 16 }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <Text style={{ color: "#ff4444", fontSize: 12, marginTop: 8, textAlign: "center" }}>
            {errorMsg}
          </Text>
          <Text
            style={{
              color: "#007AFF",
              fontSize: 12,
              marginTop: 8,
              cursor: "pointer",
              textDecoration: "underline",
            }}
            onClick={() => {
              setRetryKey(prev => prev + 1);
            }}
          >
            Thử lại
          </Text>
        </Box>
      )}

      {status === "playing" && (
        <Box
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            backgroundColor: "rgba(255, 0, 0, 0.85)",
            borderRadius: 4,
            padding: "2px 8px",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Box
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: "#fff",
              animation: "pulse 1.5s infinite",
            }}
          />
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}>
            LIVE
          </Text>
        </Box>
      )}

      {status === "playing" && (
        <Text
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            color: "rgba(255,255,255,0.5)",
            fontSize: 10,
          }}
        >
          Nhấn để bật/tắt âm thanh
        </Text>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Box>
  );
};

export default CameraStream;
