import './styles.css';

import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import createGlobe from 'cobe';
import usePartySocket from 'partysocket/react';

// The type of messages we'll be receiving from the server
import type { OutgoingMessage } from '../shared';

function App() {
	// A reference to the canvas element where we'll render the globe
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// The number of markers we're currently displaying
	const [counter, setCounter] = useState(0);
	// A map of marker IDs to their positions
	// Note that we use a ref because the globe's `onRender` callback
	// is called on every animation frame, and we don't want to re-render
	// the component on every frame.
	const positions = useRef<
		Map<
			string,
			{
				location: [number, number];
				size: number;
			}
		>
	>(new Map());
	// Connect to the PartyServer server
	const socket = usePartySocket({
		room: 'default',
		party: 'globe',
		onMessage(evt) {
			const message = JSON.parse(evt.data as string) as OutgoingMessage;
			if (message.type === 'add-marker') {
				// Add the marker to our map
				positions.current.set(message.position.id, {
					location: [message.position.lat, message.position.lng],
					size: message.position.id === socket.id ? 0.1 : 0.05,
				});
				// Update the counter
				setCounter((c) => c + 1);
			} else {
				// Remove the marker from our map
				positions.current.delete(message.id);
				// Update the counter
				setCounter((c) => c - 1);
			}
		},
	});

	const [dimensions, setDimensions] = useState({ width: 1200, height: 1200 });

	useEffect(() => {
		function handleResize() {
			const size = Math.min(window.innerWidth, 600);
			setDimensions({ width: size * 2, height: size * 2 });
		}
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		// The angle of rotation of the globe
		// We'll update this on every frame to make the globe spin
		let phi = 0;

		const globe = createGlobe(canvasRef.current as HTMLCanvasElement, {
			devicePixelRatio: 2,
			width: dimensions.width,
			height: dimensions.height,
			phi: 0,
			theta: 0,
			dark: 1,
			diffuse: 1.0,
			scale: 1.0,
			mapSamples: 16000,
			mapBrightness: 6,
			baseColor: [0.3, 0.3, 0.3],
			markerColor: [0.8, 0.1, 0.1],
			glowColor: [0.2, 0.2, 0.2],
			markers: [],
			opacity: 0.7,
			onRender: (state) => {
				// Called on every animation frame.
				// `state` will be an empty object, return updated params.

				// Get the current positions from our map
				state.markers = [...positions.current.values()];

				// Rotate the globe
				state.phi = phi;
				phi += 0.001;
			},
		});

		return () => {
			globe.destroy();
		};
	}, [dimensions]);

	return (
		<div className="App" style={{ textAlign: 'center' }}>
			{counter !== 0 ? (
				<p>
					<b>{counter}</b> {counter === 1 ? 'person' : 'people'} connected.
				</p>
			) : (
				<p>&nbsp;</p>
			)}

			{/* The canvas where we'll render the globe */}
			<canvas
				ref={canvasRef}
				style={{
					display: 'block',
					margin: '0 auto',
					width: '100%',
					maxWidth: 600,
					aspectRatio: '1',
				}}
			/>

			{/* Let's give some credit */}
			{/* <p>
        Powered by <a href="https://cobe.vercel.app/">🌏 Cobe</a>,{" "}
        <a href="https://www.npmjs.com/package/phenomenon">Phenomenon</a> and{" "}
        <a href="https://npmjs.com/package/partyserver/">🎈 PartyServer</a>
      </p> */}
		</div>
	);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(<App />);
