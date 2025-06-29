//@ts-check

const MAX_HISTORY_LENGTH = 10;
const apiEndpoint = 'https://lianageo--2fae5f5953854a7a93380424561eeddc.web.val.run';

if (!apiEndpoint.includes('run')) {
	throw new Error('Please use your own val.town endpoint!');
}

let messageHistory = {
	messages: [
		{
			role: 'system',
			content: `You are a poet. Respond to each word or phrase with a short, elegant poetic verse. Reply only with the poem.`,
		},
	],
};

document.addEventListener('DOMContentLoaded', () => {
	const poemDisplay = document.querySelector('.poem-display');
	const userPromptDisplay = document.querySelector('.user-prompt');
	const inputElement = document.querySelector('input[name="content"]');
	const formElement = document.querySelector('form');

	if (!poemDisplay || !inputElement || !formElement || !userPromptDisplay) {
		throw new Error('Required elements are missing in the DOM.');
	}

	formElement.addEventListener('submit', async (event) => {
		event.preventDefault();
		const formData = new FormData(formElement);
		const content = formData.get('content');
		if (!content) return;

		await sendPromptAndRender(String(content));
		inputElement.value = '';
	});

	document.querySelectorAll('.color-buttons button').forEach((button) => {
		button.addEventListener('click', () => {
			const color = button.getAttribute('data-color');
			if (color) sendPromptAndRender(color);
		});
	});

	document.querySelectorAll('.submit-buttons button').forEach((button) => {
		button.addEventListener('click', () => {
			const special = button.getAttribute('data-special');
			if (special) sendPromptAndRender(special);
		});
	});
});

async function sendPromptAndRender(content) {
	const poemDisplay = document.querySelector('.poem-display');
	const userPromptDisplay = document.querySelector('.user-prompt');
	if (!poemDisplay || !userPromptDisplay) return;

	userPromptDisplay.textContent = `Prompt: ${content}`;

	messageHistory.messages.push({ role: 'user', content });
	messageHistory = truncateHistory(messageHistory);

	const response = await fetch(apiEndpoint, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(messageHistory),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText);
	}

	const data = await response.json();
	const assistantMessage = data.completion.choices[0].message;
	messageHistory.messages.push(assistantMessage);
	messageHistory = truncateHistory(messageHistory);

	typeTextEffect(poemDisplay, assistantMessage.content.trim());
}

function truncateHistory(history) {
	const [system, ...rest] = history.messages;
	const trimmed = rest.slice(-MAX_HISTORY_LENGTH);
	return { messages: [system, ...trimmed] };
}

function typeTextEffect(element, text, speed = 40) {
	element.textContent = '';
	let i = 0;

	const interval = setInterval(() => {
		element.textContent += text.charAt(i);
		i++;
		if (i >= text.length) {
			clearInterval(interval);
		}
	}, speed);
}

