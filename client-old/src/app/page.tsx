// client/src/app/page.tsx (Ví dụ đơn giản, giả định bạn dùng TypeScript)
'use client'; // Bắt buộc vì bạn sử dụng hook (useWeb3) và tương tác với DOM (MetaMask)

import Link from 'next/link';
import  useWeb3  from '../../hooks/useWeb3'; // Đường dẫn tương đối phải chính xác!

// export default function HomePage() {
//   const { web3, contract, accounts } = useWeb3();
//   const isConnected = accounts.length > 0 && contract;

//   return (
//     <div style={{ padding: '20px', fontFamily: 'Arial' }}>
//       <h1>Hệ thống EHR Management DApp</h1>
      
//       {/* HIỂN THỊ TRẠNG THÁI KẾT NỐI */}
//       {isConnected ? (
//         <p style={{ color: 'green' }}>✅ Đã kết nối với Ganache. Tài khoản: <strong>{accounts[0]}</strong></p>
//       ) : (
//         <p style={{ color: 'orange' }}>⏳ Đang kết nối MetaMask và tải Contract...</p>
//       )}

//       <hr />

//       <h2>Chọn Chức năng:</h2>
//       <nav>
//         <ul style={{ listStyleType: 'none', padding: 0 }}>
//           {/* SỬ DỤNG COMPONENT LINK CỦA NEXT.JS CHO ĐIỀU HƯỚNG */}
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/certification" style={{ color: 'blue', textDecoration: 'underline' }}>
//               Bệnh nhân: Ghi Chứng thực Hồ sơ
//             </Link>
//           </li>
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/access" style={{ color: 'blue', textDecoration: 'underline' }}>
//               Bệnh nhân: Quản lý/Cấp Quyền Truy cập
//             </Link>
//           </li>
//           <li style={{ margin: '10px 0' }}>
//             <Link href="/verification" style={{ color: 'blue', textDecoration: 'underline' }}>
//               Bác sĩ: Xác thực và Kiểm tra Tính Toàn vẹn
//             </Link>
//           </li>
//         </ul>
//       </nav>

//       {!isConnected && (
//           <p style={{ marginTop: '20px', color: 'red' }}>
//             (*) Vui lòng kiểm tra MetaMask để chấp nhận kết nối.
//           </p>
//       )}
//     </div>
//   );
// }

export default function Home() {
    const { web3, contract, account, isConnected, error } = useWeb3();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-8">Hệ thống Quản lý Hồ sơ Sức khỏe Điện tử</h1>

            {/* Hiển thị trạng thái kết nối */}
            <div className="mb-8 p-4 border rounded">
                <h2 className="text-xl font-semibold mb-4">Trạng thái kết nối</h2>
                {error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <>
                        <p>Trạng thái: {isConnected ? 'Đã kết nối' : 'Chưa kết nối'}</p>
                        {account && <p>Tài khoản: {account}</p>}
                    </>
                )}
            </div>

            {/* Menu điều hướng */}
            {isConnected && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Link href="/certification" className="p-4 border rounded hover:bg-gray-100">
                            <h3 className="text-xl font-semibold mb-2">Ghi chứng thực</h3>
                            <p>Ghi hash của hồ sơ lên blockchain</p>
                    </Link>

                    <Link href="/access" className="p-4 border rounded hover:bg-gray-100">
                            <h3 className="text-xl font-semibold mb-2">Quản lý quyền truy cập</h3>
                            <p>Cấp và thu hồi quyền truy cập hồ sơ</p>
                    </Link>

                    <Link href="/verification" className="p-4 border rounded hover:bg-gray-100">
                            <h3 className="text-xl font-semibold mb-2">Xác thực hồ sơ</h3>
                            <p>Kiểm tra tính toàn vẹn của hồ sơ</p>
                    </Link>
                </div>
            )}
        </div>
    );
}