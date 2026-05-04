1. Giới thiệu dự án
    - WHERE IS UET'S GATE là một trò chơi 3D tương tác được phát triển bằng Theejs, mô phỏng cuộc hành trình đi tìm cổng UET của sing viên UET bằng các phương tiện khác nhau như xe máy, đi bộ hay cánh cửa thần kỳ(?). 
    
    - Dự án này nhằm mục đích tạo ra một trải nghiệm giải trí độc đáo, đồng thời giới thiệu về khả năng của Three.js trong việc xây dựng môi trường 3D phức tạp và tương tác. Người chơi sẽ được khám phá cổng trường và các landmark đặc trưng của UET. Đây hứa hẹn sẽ là một trò chơi thú vị, mang đậm dấu ấn của UET và sự sáng tạo của nhóm phát triển.

2. Các tính năng chính
    - Mô phỏng 3D: Tái hiện cổng trường và các landmark đặc trưng của UET.
    - Chế độ kép (Dual Mode): Tùy chọn giữa lái xe máy tốc độ cao và đi bộ.
    - Hệ thống nạp tài nguyên thông minh:Sử dụng AssetLoader để quản lý đồng bộ các model.glb, đảm bảo game chỉ chạy khi mọi thứ đã sẵn sàng.
    - Hiệu ứng Intro sáng tạo: Màn hình chờ sống động với hiệu ứng chuối rơi ngẫu nhiên.
    - UI/UX tối ưu: Giao diện người dùng được thiết kế bằng HTML/CSS đè lên lớp Canvas 3D, giúp hình ảnh sắc nét và dễ tương tác.

3. Cấu trúc mã nguồn

/Wayfinder
- index.html          # Cấu trúc trang web và các lớp UI
- main.js             # Điểm khởi đầu, quản lý logic game chính
- assetLoader.js      # Xử lý nạp model 3D và texture
- environment.js      # Xây dựng bầu trời, mặt đất và sương mù
- intro.js            # Điều khiển màn hình giới thiệu (Intro Scene)
- pedestrian.js       # Logic di chuyển cho chế độ đi bộ
- motobike.js         # Logic di chuyển cho chế độ xe máy
- leaderboard.js       #Logic điều khiển bảng xếp hạng người chơi.
- public/             # Chứa model .glb và hình ảnh thiết kế
    

4. Hướng dẫn sử dụng
    - Cách chạy dự án:
        Tải mã nguồn về máy tính. Đảm bảo bạn đã cài đặt Node.js.

        Cài đặt dependencies bằng cách chạy lệnh npm install.

        Chạy dự án bằng cách chạy lệnh npm run dev
    - Điều khiển game:
        Sử dụng các nút điều hướng để điều khiển hướng đi của nhân vật

5. Công nghệ sử dụng
    - Ngôn ngữ chính: JavaScript, HTML, CSS
    - Thư viện đồ họa: Three.js
    - Thiết kế Asset: Blender (Model 3D), Adobe Illustrator, Photoshop (UI/UX).
    - Quản lý mã nguồn: Git & GitHub Desktop.

--------------------------------------------------------------------------------------------------------------
Dự án được thực hiện bởi:
    - Trần Thị Dung (Leader)
    - Nguyễn Ánh Bình Minh
    - Giang Thị Thùy Anh
    - Đỗ Thị Hoài
    - Trần Quốc Phương
______________________________________
Trường Đại học Công nghệ - ĐHQGHN.