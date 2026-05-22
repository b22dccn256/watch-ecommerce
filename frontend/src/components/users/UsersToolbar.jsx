const UsersToolbar = ({ search, onSearchChange, roleFilter, onRoleFilterChange }) => {
	return (
		<div className='flex items-center gap-3'>
			<div className='relative'>
				<input
					type='text'
					placeholder='Tìm theo tên, email, SĐT...'
					value={search}
					onChange={onSearchChange}
					className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 text-white placeholder-gray-500'
				/>
			</div>
			<select 
				value={roleFilter}
				onChange={onRoleFilterChange}
				className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-pointer'
			>
				<option value="">Tất cả vai trò</option>
				<option value="customer">Khách hàng</option>
				<option value="admin">Quản trị viên</option>
			</select>
		</div>
	);
};

export default UsersToolbar;
