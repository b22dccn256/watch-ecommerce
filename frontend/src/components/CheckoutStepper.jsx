import { Check } from "lucide-react";
import { Link } from "react-router-dom";

const CheckoutStepper = ({ currentStep }) => {
	const steps = [
		{ id: 1, title: 'Giỏ Hàng', link: '/cart' },
		{ id: 2, title: 'Thanh Toán', link: '/checkout' },
		{ id: 3, title: 'Hoàn Tất', link: null }
	];

	return (
		<div className="w-full py-6 md:py-10 mb-4 bg-surface-soft border-b border-black/8 dark:border-white/8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="flex items-center justify-between relative">
					{/* Progress Line */}
					<div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-black/12 dark:bg-white/12 -z-10"></div>
					<div 
						className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[color:var(--color-gold)] -z-10 transition-all duration-500 ease-in-out"
						style={{ width: `${(currentStep - 1) / (steps.length - 1) * 100}%` }}
					></div>

					{steps.map((step) => {
						const isCompleted = step.id < currentStep;
						const isActive = step.id === currentStep;
						const isClickable = step.id < currentStep && step.link;

						const StepContent = () => (
							<div className="flex flex-col items-center gap-3 bg-surface-soft px-2 group">
								<div 
									className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-colors duration-300 shadow-sm
									${isCompleted ? 'bg-[color:var(--color-gold)] text-black border-2 border-[color:var(--color-gold)]' 
									: isActive ? 'bg-surface text-[color:var(--color-gold)] border-2 border-[color:var(--color-gold)]' 
									: 'bg-surface text-muted border-2 border-black/10 dark:border-white/10'}`}
								>
									{isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : step.id}
								</div>
								<span className={`text-xs md:text-sm font-bold uppercase tracking-widest text-center
									${isCompleted || isActive ? 'text-gray-900 dark:text-white' : 'text-secondary'}`}>
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
										<div>
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
