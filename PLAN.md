# Plan Chuẩn Hóa Sidebar Filter Và Taxonomy Đồng Hồ

## Summary

Mục tiêu là sửa sidebar catalog để chuyên nghiệp hơn, đúng mindset ecommerce đồng hồ/luxury watch, đồng thời dọn dữ liệu taxonomy đang gây mất trust.

Hiện trạng đã xác nhận:
- Duplicate category nằm trong MongoDB thật: `Bộ Máy Pin (Quartz)` x3 và `Cơ Tự Động (Automatic)` x3.
- `DbgBrand` còn trong DB, đang 0 sản phẩm.
- API brand đang trả cả brand active nhưng không có sản phẩm, gồm nhiều brand test/e2e.
- Frontend đang trộn `Danh mục`, `Bộ máy`, `Smartwatch`, `Điện tử`.
- Filter size hiện dùng exact values hơi rời rạc.
- Schema/product data đã có nền cho luxury filters: `specs.case.material`, `specs.strap.material`, `specs.waterResistance`, `specs.glass`, `specs.functions`.

## Key Changes

### 1. Data Cleanup Và Taxonomy

- Viết migration/dry-run để:
  - Xóa hoặc merge 6 category movement duplicate.
  - Giữ category chính:
    - `Đồng hồ nam`
    - `Đồng hồ nữ`
    - `Đồng hồ unisex`
    - `Smartwatch`
  - Chuyển sản phẩm đang trỏ tới category duplicate về category theo `gender`.
  - Không dùng movement làm category con nữa.
  - Deactivate hoặc xóa `DbgBrand`.
  - Deactivate các brand test/e2e 0 sản phẩm, trừ brand seed hợp lệ cần giữ.

- Cập nhật seed category để không tái tạo duplicate:
  - Không seed `Cơ Tự Động (Automatic)` và `Bộ Máy Pin (Quartz)` dưới từng gender.
  - Nếu sản phẩm là smartwatch thì category là `Smartwatch`.
  - Các sản phẩm còn lại map theo `gender`.

### 2. Sidebar Filter UX

- Sắp xếp filter theo thứ tự:
  1. `Thương hiệu`
  2. `Khoảng giá`
  3. `Danh mục`
  4. `Bộ máy`
  5. `Kích thước mặt`
  6. `Dây đeo`
  7. `Màu sắc`
  8. Luxury filters bổ sung nếu có data

- Chuẩn hóa label tiếng Việt:
  - `quartz` → `Máy pin`
  - `automatic` → `Cơ tự động`
  - `mechanical` → `Cơ lên cót tay`
  - `solar` → `Năng lượng ánh sáng`
  - Không hiển thị `digital` trong `Bộ máy`.
  - Không hiển thị `smartwatch` trong `Bộ máy`.

- `Danh mục` chỉ hiển thị:
  - `Đồng hồ nam`
  - `Đồng hồ nữ`
  - `Đồng hồ unisex`
  - `Smartwatch`

- `Dây đeo` đổi label:
  - `Thép không gỉ`/`Thép không gỉ 316L` → hiển thị `Dây thép`
  - Query backend vẫn match các biến thể chứa `Thép`.

- `Màu sắc`:
  - Chỉ render section khi có màu khả dụng từ data hoặc facet API.
  - Không để section rỗng.

### 3. Price, Size Và Luxury Filters

- Thêm preset giá:
  - `Dưới 5 triệu`: `maxPrice=5000000`
  - `5-10 triệu`: `minPrice=5000000&maxPrice=10000000`
  - `10-20 triệu`: `minPrice=10000000&maxPrice=20000000`
  - `20-50 triệu`: `minPrice=20000000&maxPrice=50000000`
  - `Trên 50 triệu`: `minPrice=50000000`
  - Giữ custom range phía sau preset.

- Chuẩn hóa size filter:
  - `Dưới 38mm`
  - `38-40mm`
  - `40-42mm`
  - `42-44mm`
  - `Trên 44mm`

- Backend query size theo numeric range:
  - Parse số từ `sizes[]` và/hoặc `specs.case.diameter`.
  - Match sản phẩm nếu bất kỳ size/diameter nằm trong range.

- Bổ sung luxury filters:
  - `Chất liệu vỏ`: `Thép`, `Titanium`, `Vàng`, `Ceramic`
  - `Chống nước`: `30m`, `50m`, `100m`, `200m+`
  - `Loại kính`: `Sapphire`, `Mineral`, `Hardlex`, `Acrylic`
  - `Chức năng`: `Chronograph`, `GMT`, `Moonphase`

## Public API / Interface Changes

- Extend `/api/products` query params:
  - `category`: category slug/id như hiện tại, nhưng category không còn đại diện movement.
  - `machineType`: chỉ nhận `quartz,automatic,mechanical,solar`.
  - `sizeRange`: nhận key cố định như `under_38`, `38_40`, `40_42`, `42_44`, `over_44`.
  - `caseMaterial`: comma-separated labels.
  - `waterResistance`: comma-separated preset keys.
  - `glass`: comma-separated labels.
  - `functions`: comma-separated labels.

- Nên thêm hoặc chỉnh `/api/brands`:
  - Mặc định storefront chỉ trả brand active có ít nhất 1 active product.
  - Admin vẫn cần xem được brand 0 sản phẩm qua endpoint/admin flow hiện có hoặc query riêng.

- Zustand filter state cần thêm:
  - `sizeRange: []`
  - `caseMaterial: []`
  - `waterResistance: []`
  - `glass: []`
  - `functions: []`

## Implementation Notes

- Ưu tiên tạo constants dùng chung ở frontend cho labels/filter options để tránh lặp giữa sidebar, product detail, create/edit form.
- Admin create/edit form vẫn lưu canonical values, nhưng label hiển thị phải thống nhất tiếng Việt.
- Product detail không còn hiển thị `Bộ máy pin (Quartz)` kiểu nửa Việt nửa Anh; dùng cùng label map.
- Marketing/admin dropdown cũng phải bỏ label cũ và không để `Smartwatch` trong movement nếu field đó là `type`.
- Nếu cần hỗ trợ smartwatch lâu dài, nên xử lý bằng category/tag riêng, không ép vào `type` movement trong UI filter.

## Test Plan

- Data verification:
  - Chạy audit trước/sau migration để xác nhận không còn duplicate category.
  - Xác nhận không còn `DbgBrand` trong storefront brand list.
  - Xác nhận product count không bị mất sau khi remap category.

- API tests:
  - `/api/products?machineType=quartz` trả máy pin.
  - `/api/products?category=dong-ho-nam` trả đồng hồ nam, không phụ thuộc movement.
  - `/api/products?sizeRange=40_42` match size/diameter 40-42mm.
  - `/api/products?caseMaterial=Titanium`, `glass=Sapphire`, `functions=GMT` hoạt động khi có data.
  - `/api/brands` storefront không trả brand 0 sản phẩm.

- UI checks:
  - Sidebar không còn duplicate `Bộ Máy Pin (Quartz)`/`Cơ Tự Động (Automatic)`.
  - `Danh mục` và `Bộ máy` tách riêng.
  - `Smartwatch` chỉ nằm ở `Danh mục`.
  - Không có section `Màu sắc` rỗng.
  - Price preset hoạt động và chip hiển thị đúng.
  - Reset filter xóa toàn bộ state mới và cũ.

## Assumptions

- Ưu tiên tiếng Việt đồng nhất thay vì luxury English labels.
- `Smartwatch` là category, không phải movement.
- `Digital` không dùng trong movement filter v1; nếu cần sau này sẽ là `Đồng hồ điện tử` category/tag riêng.
- Storefront brand list nên ưu tiên brand có sản phẩm active để tránh brand test/placeholder làm giảm trust.
- Migration cần chạy dry-run trước khi apply thật.
