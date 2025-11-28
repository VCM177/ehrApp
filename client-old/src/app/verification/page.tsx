'use client';

import { useState } from 'react';
import useWeb3 from '../../../hooks/useWeb3';

export default function Verification() {
    const { contract, isConnected } = useWeb3();
    const [fileHash, setFileHash] = useState('');
    const [status, setStatus] = useState('');

    const handleVerify = async (e: any) => {
        e.preventDefault();
        if (!isConnected || !contract) {
            setStatus('Vui lòng kết nối với MetaMask');
            return;
        }

        try {
            const exists = await (contract as any).methods.verifyRecord(fileHash).call();
            setStatus(exists 
                ? 'Hồ sơ này đã được chứng thực trên blockchain!' 
                : 'Hồ sơ này chưa được chứng thực.');
        } catch (error: any) {
            setStatus('Lỗi: ' + error.message);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Xác thực hồ sơ</h1>

            <form onSubmit={handleVerify} className="max-w-md">
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2">
                        Hash của hồ sơ cần xác thực:
                    </label>
                    <input
                        type="text"
                        value={fileHash}
                        onChange={(e) => setFileHash(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="0x..."
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isConnected}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    Xác thực
                </button>

                {status && (
                    <p className="mt-4 p-3 border rounded">
                        {status}
                    </p>
                )}
            </form>
        </div>
    );
}