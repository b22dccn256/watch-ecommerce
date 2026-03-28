export default function LoadingSpinner() {
	return (
		<div style={{
			width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
			background: "rgba(0,0,0,0.1)", zIndex: 9999, position: "fixed", top: 0, left: 0
		}}>
			<div className="loader" style={{
				width: 32, height: 32, border: '4px solid #D4AF37', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite'
			}} />
			<span style={{ marginLeft: 12 }}>Đang tải...</span>
			<style>{`
				@keyframes spin {
					0% { transform: rotate(0deg); }
					100% { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}
