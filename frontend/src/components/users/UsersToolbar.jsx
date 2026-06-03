import { Search, Filter } from "lucide-react";

const UsersToolbar = ({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, email, số điện thoại..."
          value={search}
          onChange={onSearchChange}
          className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 text-gray-900 dark:text-white placeholder-gray-500 transition-shadow"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={roleFilter}
          onChange={onRoleFilterChange}
          className="bg-gray-50 dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <option value="">Tất cả vai trò</option>
          <option value="customer">Khách hàng</option>
          <option value="admin">Quản trị viên</option>
        </select>
        <button className="p-2.5 bg-gray-50 dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-luxury-darker transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default UsersToolbar;
