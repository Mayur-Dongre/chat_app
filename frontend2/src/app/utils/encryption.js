export const generateKeyPair = async () => {
	const keyPair = await window.crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true,
		["encrypt", "decrypt"]
	);

	return keyPair;
};

export const exportPublicKey = async (publicKey) => {
	const exported = await window.crypto.subtle.exportKey("spki", publicKey);
	return arrayBufferToBase64(exported);
};

export const importPublicKey = async (base64Key) => {
	const buffer = base64ToArrayBuffer(base64Key);
	return await window.crypto.subtle.importKey(
		"spki",
		buffer,
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		true,
		["encrypt"]
	);
};

export const exportPrivateKey = async (privateKey) => {
	const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
	return arrayBufferToBase64(exported);
};

export const importPrivateKey = async (base64Key) => {
	const buffer = base64ToArrayBuffer(base64Key);
	return await window.crypto.subtle.importKey(
		"pkcs8",
		buffer,
		{
			name: "RSA-OAEP",
			hash: "SHA-256",
		},
		true,
		["decrypt"]
	);
};

export const generateAESKey = async () => {
	return await window.crypto.subtle.generateKey(
		{
			name: "AES-GCM",
			length: 256,
		},
		true,
		["encrypt", "decrypt"]
	);
};

export const encryptMessage = async (message, aesKey) => {
	const encoder = new TextEncoder();
	const data = encoder.encode(message);
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	const encrypted = await window.crypto.subtle.encryt(
		{
			name: "AES-GCM",
			iv: iv,
		},
		aesKey,
		data
	);

	// combine IV and encrypted data
	const combined = newUint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);

	return arrayBufferToBase64(combined);
};

export const decryptMessage = async (encryptedMessage, aesKey) => {
	const combined = base64ToArrayBuffer(encryptedMessage);
	const iv = combined.slice(0, 12);
	const data = combined.slice(12);

	const decrypted = await window.crypto.subtle.decrypt(
		{
			name: "AES-GCM",
			iv: iv,
		},
		aesKey,
		data
	);

	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
};

export const encryptAESKey = async (aesKey, publicKey) => {
	const exported = await window.crypto.subtle.exportKey("raw", aesKey);
	const encrypted = await window.crypto.subtle.encrypt(
		{
			name: "RSA-OAEP",
		},
		publicKey,
		exported
	);

	return arrayBufferToBase64(encrypted);
};

export const decryptAESKey = async (encryptedKey, privateKey) => {
	const buffer = base64ToArrayBuffer(encryptedKey);
	const decrypted = await window.crypto.subtle.decrypt(
		{
			name: "RSA-OAEP",
		},
		privateKey,
		buffer
	);

	return await window.crypto.subtle.importKey(
		"raw",
		decrypted,
		{
			name: "AES-GCM",
			length: 256,
		},
		true,
		["encrypt", "decrypt"]
	);
};

const arrayBufferToBase64 = (buffer) => {
	const bytes = new Uint8Array(buffer);
	let binary = "";

	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}

	return btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);

	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}

	return bytes.buffer;
};
