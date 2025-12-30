import { Vector2 } from "three";

/**
 * @module CurtainShader
 */

/**
 * Water ripple shader for curtain transition effect.
 *
 * @constant
 * @type {ShaderMaterial~Shader}
 */
const RippleShader = {
  name: "RippleShader",

  uniforms: {
    tDiffuse: { value: null },
    uProgress: { value: 0.0 },
    tSize: { value: new Vector2(256, 256) },
    center: { value: new Vector2(0.5, 0.5) },
    angle: { value: 1.57 },
    scale: { value: 1.0 },
  },

  vertexShader: /* glsl */ `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

  fragmentShader: /* glsl */ `

		uniform vec2 center;
        uniform float uProgress;
		uniform float angle;
		uniform float scale;
		uniform vec2 tSize;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {
            vec2 p = vUv;
            
            // Only apply ripple effect when uProgress is between 0 and 1 (during transition)
            if(uProgress > 0.0 && uProgress < 1.0) {
                // Water ripple effect parameters
                float frequency = 20.0; // Number of ripples
                float baseAmplitude = 0.03; // Base strength of the ripple distortion
                float speed = 2.0; // Speed of ripple expansion
                
                // Amplitude is 0 when still, peaks during transition, then fades
                // This creates a smooth start and end
                float amplitudeMultiplier = sin(uProgress * 3.14159); // 0 -> 1 -> 0
                float amplitude = baseAmplitude * amplitudeMultiplier * 1.0;
                
                // Calculate distance from center
                vec2 toCenter = p - center;
                float dist = length(toCenter);
                
                // Create expanding ripple wave
                float wave = sin((dist * frequency) - (uProgress * speed * 6.28318)) * amplitude * 5.0;
                
                // Apply ripple distortion
                vec2 rippleOffset = normalize(toCenter) * wave;
                p += rippleOffset * 1.0;
                
                // Add secondary smaller ripples for more realistic water effect
                float wave2 = sin((dist * frequency * 2.0) - (uProgress * speed * 8.0)) * amplitude ;
                p += normalize(toCenter) * wave2;
            }

			vec4 color = texture2D( tDiffuse, p );

			gl_FragColor = color;

		}`,
};

export { RippleShader };
