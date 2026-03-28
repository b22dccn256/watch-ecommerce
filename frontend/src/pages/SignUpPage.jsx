import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Loader, Github, Facebook } from "lucide-react";
import { motion } from "framer-motion";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});

	const { signup, loading } = useUserStore();

	const handleSubmit = (e) => {
		e.preventDefault();
		signup(formData);
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-yellow-500'>Đăng ký tài khoản</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-white dark:bg-gray-800 py-8 px-4 shadow-xl border border-gray-100 dark:border-transparent sm:rounded-lg sm:px-10'>
					<form onSubmit={handleSubmit} className='space-y-6'>
						<div>
							<label htmlFor='name' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Full name
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<User className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='name'
									type='text'
									required
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className='block w-full px-3 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm
									 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
									placeholder='John Doe'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='email' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Email address
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Mail className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='email'
									type='email'
									required
									value={formData.email}
									onChange={(e) => setFormData({ ...formData, email: e.target.value })}
									className=' block w-full px-3 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
									rounded-md shadow-sm text-gray-900 dark:text-white
									 placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
									 focus:border-emerald-500 sm:text-sm'
									placeholder='you@example.com'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='password' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='password'
									type='password'
									required
									value={formData.password}
									onChange={(e) => setFormData({ ...formData, password: e.target.value })}
									className=' block w-full px-3 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 
									rounded-md shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
									placeholder='••••••••'
								/>
							</div>
						</div>

						<div>
							<label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
								Confirm Password
							</label>
							<div className='mt-1 relative rounded-md shadow-sm'>
								<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
									<Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
								</div>
								<input
									id='confirmPassword'
									type='password'
									required
									value={formData.confirmPassword}
									onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
									className=' block w-full px-3 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border
									 border-gray-200 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm'
									placeholder='••••••••'
								/>
							</div>
						</div>

						<button
							type='submit'
							className='w-full flex justify-center py-2 px-4 border border-transparent 
							rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
							 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
							  focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
							disabled={loading}
						>
							{loading ? (
								<>
									<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
									Loading...
								</>
							) : (
								<>
									<UserPlus className='mr-2 h-5 w-5' aria-hidden='true' />
									Sign up
								</>
							)}
						</button>

						{/* Social Logins */}
						<div className="mt-6">
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Hoặc tiếp tục với</span>
								</div>
							</div>

							<div className="mt-6 grid grid-cols-3 gap-3">
								<button onClick={() => window.location.href = "/api/auth/oauth/google"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
									<svg className="w-5 h-5" viewBox="0 0 24 24">
										<path fill="#EA4335" d="M12.545,10.239v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-3.284,0-5.962-2.73-5.962-6.101s2.678-6.101,5.962-6.101c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617c-5.467,0-9.897,4.48-9.897,10.038s4.43,10.038,9.897,10.038c5.719,0,9.507-4.02,9.507-9.673c0-0.742-0.088-1.393-0.211-1.999H12.545z" />
										<path fill="#34A853" d="M22.052,12.038c0-0.742-0.088-1.393-0.211-1.999H12.545v3.821h5.445c-0.231,1.139-1.317,3.33-5.445,3.33c-0.908,0-1.76-0.203-2.527-0.569l-2.674,2.028v0.015c1.442,1.339,3.396,2.152,5.201,2.152C17.771,22.076,22.052,18.056,22.052,12.038z" />
										<path fill="#4A90E2" d="M12.545,8.156c1.86,0,3.109,0.796,3.818,1.472l2.997-2.909c-1.782-1.636-4.085-2.617-6.816-2.617C8.751,4.102,5.83,5.656,4.053,8.016l2.674,2.028C7.545,8.818,9.866,8.156,12.545,8.156z" />
										<path fill="#FBBC05" d="M6.726,10.044c-0.187,0.612-0.291,1.267-0.291,1.956s0.104,1.344,0.291,1.956l-2.674,2.028C3.473,14.887,3.18,13.488,3.18,12s0.293-2.887,0.871-4.148L6.726,10.044z" />
									</svg>
								</button>
								<button onClick={() => window.location.href = "/api/auth/oauth/facebook"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
									<Facebook className="w-5 h-5 text-blue-600" />
								</button>
								<button onClick={() => window.location.href = "/api/auth/oauth/github"} type="button" className="w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition">
									<Github className="w-5 h-5 text-gray-900 dark:text-gray-100" />
								</button>
							</div>
						</div>
					</form>

					<p className='mt-8 text-center text-sm text-gray-400'>
						Already have an account?{" "}
						<Link to='/login' className='font-medium text-yellow-500 hover:text-yellow-400'>
							Đăng nhập tại đây <ArrowRight className='inline h-4 w-4' />
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
};
export default SignUpPage;
