(() => {
	const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzDPYAze5wvvt-4CNZUQ7LSZNLAtIB_74_TMsvKcZiz1oRaosQJcocEU07aFd4Qef_yDw/exec";

	const form = document.getElementById("contact-form");
	const note = document.getElementById("form-note");

	if (!form || !note) {
		return;
	}

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const name = form.elements.name.value.trim();
		const email = form.elements.email.value.trim();
		const message = form.elements.message.value.trim();

		if (!name || !email || !message) {
			note.textContent = "すべての項目を入力してください。";
			return;
		}

		const submitButton = form.querySelector(".send-button");
		const originalLabel = submitButton ? submitButton.textContent : "Send";

		try {
			if (submitButton) {
				submitButton.disabled = true;
				submitButton.textContent = "Sending...";
			}

			note.textContent = "送信中です...";

			await fetch(GAS_WEB_APP_URL, {
				method: "POST",
				mode: "no-cors",
				body: JSON.stringify({
					action: "contact",
					name,
					email,
					message,
				}),
			});

			form.reset();
			note.textContent = "送信しました。ありがとうございます。";
		} catch (error) {
			console.error(error);
			note.textContent = "送信に失敗しました。しばらくしてからもう一度お試しください。";
		} finally {
			if (submitButton) {
				submitButton.disabled = false;
				submitButton.textContent = originalLabel;
			}
		}
	});
})();
