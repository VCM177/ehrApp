'use client';

import { useState, FormEvent } from 'react';
import useWeb3 from '../../../hooks/useWeb3';

export default function Access() {
    const { contract, account, isConnected } = useWeb3() ;
    const [fileHash, setFileHash] = useState<string>('');
    const [doctorAddress, setDoctorAddress] = useState<string>('');
    const [status, setStatus] = useState<string>('');

    const handleGrantAccess = async (e: FormEvent) => {
        e.preventDefault();
        if (!isConnected || !contract || !account[0]) {
            setStatus('Vui lòng kết nối với MetaMask');
            return;
        }

        try {
            setStatus('Đang cấp quyền...');
            await (contract as any).methods.grantAccess(fileHash, doctorAddress)
                .send({ from: account[0] });
            setStatus('Đã cấp quyền thành công!');
        } catch (error: any) {
            setStatus('Lỗi: ' + error.message);
        }
    };

    const handleRevokeAccess = async (e: FormEvent) => {
        e.preventDefault();
        if (!isConnected || !contract || !account[0]) {
            setStatus('Vui lòng kết nối với MetaMask');
            return;
        }

        try {
            setStatus('Đang thu hồi quyền...');
            await (contract as any).methods.revokeAccess(fileHash, doctorAddress)
                .send({ from: account[0] });
            setStatus('Đã thu hồi quyền thành công!');
        } catch (error: any) {
            setStatus('Lỗi: ' + error.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Quản lý quyền truy cập</h1>

            <form className="max-w-md">
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Hash của hồ sơ:
                    </label>
                    <input
                        type="text"
                        value={fileHash}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFileHash(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Địa chỉ bác sĩ:
                    </label>
                    <input
                        type="text"
                        value={doctorAddress}
                        onChange={(e) => setDoctorAddress(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                        required
                    />
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={(e: FormEvent) => handleGrantAccess(e)}
                        disabled={!isConnected}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                    >
                        Cấp quyền
                    </button>

                    <button
                        onClick={handleRevokeAccess}
                        disabled={!isConnected}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
                    >
                        Thu hồi quyền
                    </button>
                </div>

                {status && (
                    <p className="mt-4 p-3 border rounded">
                        {status}
                    </p>
                )}
            </form>
        </div>
    );
}