import React, { useState, useMemo, useEffect, useRef } from "react";
import { Input, Box, Text, Modal, List, Icon } from "zmp-ui";
import styled from "styled-components";
import clsx from "clsx";

// Danh sách ngân hàng phổ biến (VietQR)
const BANKS = [
    { code: "VCB", name: "Vietcombank", shortName: "Vietcombank" },
    { code: "TCB", name: "Techcombank", shortName: "Techcombank" },
    { code: "CTG", name: "VietinBank", shortName: "VietinBank" },
    { code: "BIDV", name: "BIDV", shortName: "BIDV" },
    { code: "MB", name: "MBBank", shortName: "MBBank" },
    { code: "ACB", name: "ACB", shortName: "ACB" },
    { code: "VPB", name: "VPBank", shortName: "VPBank" },
    { code: "TPB", name: "TPBank", shortName: "TPBank" },
    { code: "STB", name: "Sacombank", shortName: "Sacombank" },
    { code: "HDB", name: "HDBank", shortName: "HDBank" },
    { code: "VIB", name: "VIB", shortName: "VIB" },
    { code: "EIB", name: "Eximbank", shortName: "Eximbank" },
    { code: "SHB", name: "SHB", shortName: "SHB" },
    { code: "OCB", name: "OCB", shortName: "OCB" },
    { code: "MSB", name: "MSB", shortName: "MSB" },
    { code: "LPB", name: "LienVietPostBank", shortName: "LienVietPostBank" },
    { code: "SEAB", name: "SeABank", shortName: "SeABank" },
    { code: "BAB", name: "Bac A Bank", shortName: "Bac A Bank" },
    { code: "VCCB", name: "VietCapitalBank", shortName: "VietCapitalBank" },
    { code: "NCB", name: "NCB", shortName: "NCB" },
    { code: "KLB", name: "KienLongBank", shortName: "KienLongBank" },
    { code: "VAB", name: "VietABank", shortName: "VietABank" },
    { code: "NAB", name: "Nam A Bank", shortName: "Nam A Bank" },
    { code: "PGB", name: "PGBank", shortName: "PGBank" },
    { code: "GPB", name: "GPBank", shortName: "GPBank" },
    { code: "OJB", name: "OceanBank", shortName: "OceanBank" },
    { code: "BVB", name: "BaoVietBank", shortName: "BaoVietBank" },
    { code: "AGR", name: "Agribank", shortName: "Agribank" },
    { code: "VRB", name: "VRB", shortName: "VRB" },
    { code: "VID", name: "PublicBank", shortName: "PublicBank" },
    { code: "IVB", name: "IndovinaBank", shortName: "IndovinaBank" },
    { code: "DAB", name: "DongA Bank", shortName: "DongA Bank" },
    { code: "SGB", name: "SaigonBank", shortName: "SaigonBank" },
    { code: "CBB", name: "CBBank", shortName: "CBBank" },
];

interface BankSelectProps {
    value: string;
    onChange: (value: string) => void;
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

    const handleSelect = (bankName: string) => {
        onChange(bankName);
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
                                    onClick={() => handleSelect(bank.name)}
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
