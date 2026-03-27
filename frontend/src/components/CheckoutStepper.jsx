import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const CheckoutStepper = ({ currentStep }) => {
	const steps = [
		{ id: 1, title: 'Giỏ Hàng', link: '/cart' },
		{ id: 2, title: 'Thanh Toán', link: '/checkout' },
		{ id: 3, title: 'Hoàn Tất', link: null }
	];

	return (
		<div className="w-full py-6 md:py-10 mb-4 bg-gray-50 dark:bg-black/50 border-b border-gray-200 dark:border-gray-800">
			<div className="max-w-4xl mx-auto px-4">
				<div className="flex items-center justify-between relative">
					{/* Progress Line */}
					<div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-200 dark:bg-gray-800 -z-10"></div>
					<div 
						className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-emerald-500 dark:bg-yellow-400 -z-10 transition-all duration-500 ease-in-out"
						style={{ width: `${(currentStep - 1) / (steps.length - 1) * 100}%` }}
					></div>

					{steps.map((step) => {
						const isCompleted = step.id < currentStep;
						const isActive = step.id === currentStep;
						const isClickable = step.id < currentStep && step.link;

						const StepContent = () => (
							<div className="flex flex-col items-center gap-3 bg-gray-50 dark:bg-black/50 px-2 group">
								<div 
									className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-colors duration-300 shadow-sm
									${isCompleted ? 'bg-emerald-500 dark:bg-yellow-400 text-white dark:text-black border-2 border-emerald-500 dark:border-yellow-400' 
									: isActive ? 'bg-white dark:bg-black text-emerald-600 dark:text-yellow-400 border-2 border-emerald-500 dark:border-yellow-400' 
									: 'bg-white dark:bg-black text-gray-400 border-2 border-gray-200 dark:border-gray-800'}`}
								>
									{isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : step.id}
								</div>
								<span className={`text-xs md:text-sm font-bold uppercase tracking-widest text-center
									${isCompleted || isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
									{step.title}
								</span>
							</div>
						);

						return (
							<div key={step.id} className="relative z-0">
								{isClickable ? (
									<Link to={step.link} className="hover:opacity-80 transition cursor-pointer">
										<StepContent />
									</Link>
								) : (
									<div className={isActive ? "" : "opacity-50"}>
										<StepContent />
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default CheckoutStepper;
