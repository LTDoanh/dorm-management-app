import React, { useState, useMemo, useEffect, useRef } from "react";
import { Input, Box, Text, Modal, List, Icon } from "zmp-ui";
import styled from "styled-components";
import clsx from "clsx";

// Danh sách ngân hàng phổ biến (VietQR) - Kèm BIN code
export const BANKS = [
    { code: "VCB", name: "Vietcombank", shortName: "Vietcombank", bin: "970436" },
    { code: "TCB", name: "Techcombank", shortName: "Techcombank", bin: "970407" },
    { code: "CTG", name: "VietinBank", shortName: "VietinBank", bin: "970415" },
    { code: "BIDV", name: "BIDV", shortName: "BIDV", bin: "970418" },
    { code: "MB", name: "MBBank", shortName: "MBBank", bin: "970422" },
    { code: "ACB", name: "ACB", shortName: "ACB", bin: "970416" },
    { code: "VPB", name: "VPBank", shortName: "VPBank", bin: "970432" },
    { code: "TPB", name: "TPBank", shortName: "TPBank", bin: "970423" },
    { code: "STB", name: "Sacombank", shortName: "Sacombank", bin: "970403" },
    { code: "HDB", name: "HDBank", shortName: "HDBank", bin: "970437" },
    { code: "VIB", name: "VIB", shortName: "VIB", bin: "970441" },
    { code: "EIB", name: "Eximbank", shortName: "Eximbank", bin: "970431" },
    { code: "SHB", name: "SHB", shortName: "SHB", bin: "970443" },
    { code: "OCB", name: "OCB", shortName: "OCB", bin: "970448" },
    { code: "MSB", name: "MSB", shortName: "MSB", bin: "970426" },
    { code: "LPB", name: "LienVietPostBank", shortName: "LPBank", bin: "970449" },
    { code: "SEAB", name: "SeABank", shortName: "SeABank", bin: "970440" },
    { code: "BAB", name: "Bac A Bank", shortName: "Bac A Bank", bin: "970409" },
    { code: "VCCB", name: "VietCapitalBank", shortName: "BVBank", bin: "970454" },
    { code: "NCB", name: "NCB", shortName: "NCB", bin: "970419" },
    { code: "KLB", name: "KienLongBank", shortName: "KienLongBank", bin: "970452" },
    { code: "VAB", name: "VietABank", shortName: "VietABank", bin: "970427" },
    { code: "NAB", name: "Nam A Bank", shortName: "Nam A Bank", bin: "970428" },
    { code: "PGB", name: "PGBank", shortName: "PGBank", bin: "970430" },
    { code: "GPB", name: "GPBank", shortName: "GPBank", bin: "970408" },
    { code: "OJB", name: "OceanBank", shortName: "OceanBank", bin: "970414" },
    { code: "BVB", name: "BaoVietBank", shortName: "BaoVietBank", bin: "970438" },
    { code: "AGR", name: "Agribank", shortName: "Agribank", bin: "970405" },
    { code: "VRB", name: "VRB", shortName: "VRB", bin: "970421" },
    { code: "VID", name: "PublicBank", shortName: "PublicBank", bin: "970439" },
    { code: "IVB", name: "IndovinaBank", shortName: "IndovinaBank", bin: "970434" },
    { code: "DAB", name: "DongA Bank", shortName: "DongA Bank", bin: "970406" },
    { code: "SGB", name: "SaigonBank", shortName: "SaigonBank", bin: "970400" },
    { code: "CBB", name: "CBBank", shortName: "CBBank", bin: "970444" },
];

interface BankSelectProps {
    value: string;
    onChange: (bankName: string, bin?: string) => void;
    placeholder?: string;
}

const BankSelect: React.FC<BankSelectProps> = ({ value, onChange, placeholder = "Chọn ngân hàng" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredBanks = useMemo(() => {
        if (!searchTerm) return BANKS;
        const lowerTerm = searchTerm.toLowerCase();
        return BANKS.filter(
            (bank) =>
                bank.name.toLowerCase().includes(lowerTerm) ||
                bank.shortName.toLowerCase().includes(lowerTerm) ||
                bank.code.toLowerCase().includes(lowerTerm)
        );
    }, [searchTerm]);

    const handleSelect = (bank: typeof BANKS[0]) => {
        onChange(bank.name, bank.bin);
        setIsOpen(false);
        setSearchTerm("");
    };

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    return (
        <>
            <div onClick={() => setIsOpen(true)}>
                <Input
                    value={value}
                    placeholder={placeholder}
                    readOnly
                    suffix={<Icon icon="zi-chevron-down" />}
                />
            </div>

            <Modal
                visible={isOpen}
                title="Chọn ngân hàng"
                onClose={() => {
                    setIsOpen(false);
                    setSearchTerm("");
                }}
                verticalActions
            >
                <Box p={4} pt={0} style={{ minHeight: "60vh", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
                    <Box pb={2}>
                        <Input.Search
                            // ref={inputRef} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm ngân hàng..."
                            clearable
                        />
                    </Box>

                    <Box style={{ overflowY: "auto", flex: 1 }}>
                        <List>
                            {filteredBanks.map((bank) => (
                                <div
                                    key={bank.code}
                                    onClick={() => handleSelect(bank)}
                                    className={clsx("zaui-list-item", value === bank.name && "bg-blue-50")}
                                    style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0", cursor: "pointer" }}
                                >
                                    <Box flex alignItems="center">
                                        <Box ml={2}>
                                            <Text.Title size="small">{bank.shortName} ({bank.code})</Text.Title>
                                            <Text size="xSmall" className="text-gray-500">{bank.name}</Text>
                                        </Box>
                                        {value === bank.name && (
                                            <Box style={{ marginLeft: "auto", marginRight: 8 }}>
                                                <Icon icon="zi-check" className="text-blue-600" />
                                            </Box>
                                        )}
                                    </Box>
                                </div>
                            ))}
                            {filteredBanks.length === 0 && (
                                <Box p={4} textAlign="center">
                                    <Text className="text-gray-500">Không tìm thấy ngân hàng nào</Text>
                                </Box>
                            )}
                        </List>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default BankSelect;
