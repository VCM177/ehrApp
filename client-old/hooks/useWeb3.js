// client/hooks/useWeb3.js
'use client';

import { useState, useEffect } from 'react';
import Web3 from 'web3';
import EHR_Certify from '../abi/EHR_Certify.json';
import { CONTRACT_ADDRESS } from '../config/contractConfig'

const useWeb3 = () => {
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);
    // Nên dùng accounts là array hoặc null/undefined để xử lý trạng thái tốt hơn
    const [account, setAccount] = useState(''); 
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const initWeb3 = async () => {
            try {
                // Kiểm tra xem MetaMask có được cài đặt không
                if (typeof window.ethereum === 'undefined') {
                    setError('Vui lòng cài đặt MetaMask!');
                    return; // Dừng lại nếu không có MetaMask
                }

                const web3Instance = new Web3(window.ethereum);
                setWeb3(web3Instance);

                // Yêu cầu kết nối tài khoản TỪ ĐẦU
                const accounts = await window.ethereum.request({ 
                    method: 'eth_requestAccounts' 
                });
                
                if (accounts.length === 0) {
                     setError('Chưa có tài khoản nào được kết nối.');
                     return;
                }
                
                setAccount(accounts[0]);
                
                // *** CHỈ KHỞI TẠO CONTRACT MỘT LẦN VỚI ĐỊA CHỈ CỨNG ***
                // Đây là phương pháp phù hợp nhất khi sử dụng địa chỉ đã triển khai từ config.
                const contractInstance = new web3Instance.eth.Contract(
                    EHR_Certify.abi,
                    CONTRACT_ADDRESS
                );
                setContract(contractInstance);
                setIsConnected(true);
                // ******************************************************

                // Lắng nghe sự kiện thay đổi tài khoản
                const handleAccountsChanged = (accs) => {
                    setAccount(accs.length > 0 ? accs[0] : null);
                    setIsConnected(accs.length > 0);
                    if (accs.length === 0) {
                        setError('Tài khoản đã bị ngắt kết nối.');
                    }
                };

                // Lắng nghe sự kiện thay đổi mạng (luôn tải lại trang)
                window.ethereum.on('accountsChanged', handleAccountsChanged);
                window.ethereum.on('chainChanged', () => window.location.reload());

            } catch (err) {
                // Xử lý lỗi từ request (ví dụ: người dùng từ chối kết nối)
                console.error("Lỗi kết nối Web3:", err);
                setError('Lỗi kết nối: Người dùng đã từ chối hoặc mạng không hợp lệ.');
                setIsConnected(false);
            }
        };

        initWeb3();

        // Cleanup listeners khi component unmount
        return () => {
            if (window.ethereum && window.ethereum.removeListener) {
                window.ethereum.removeListener('accountsChanged', () => {});
                window.ethereum.removeListener('chainChanged', () => window.location.reload());
            }
        };
    }, []);

    return {
        web3,
        contract,
        account,
        isConnected,
        error
    };
};

export default useWeb3;