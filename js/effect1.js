import { Vector2 } from "three";

/**
 * @module CurtainShader
 */

/**
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
            
            if(uProgress > 0.0 && uProgress < 1.0) {
                float frequency = 20.0; 
                float baseAmplitude = 0.03;
                float speed = 2.0; 

                float amplitudeMultiplier = sin(uProgress * 3.14159);
                float amplitude = baseAmplitude * amplitudeMultiplier * 1.0;

                vec2 toCenter = p - center;
                float dist = length(toCenter);
            
                float wave = sin((dist * frequency) - (uProgress * speed * 6.28318)) * amplitude * 5.0;
                

                vec2 rippleOffset = normalize(toCenter) * wave;
                p += rippleOffset * 1.0;

                float wave2 = sin((dist * frequency * 2.0) - (uProgress * speed * 8.0)) * amplitude ;
                p += normalize(toCenter) * wave2;
            }

			vec4 color = texture2D( tDiffuse, p );

			gl_FragColor = color;

		}`,
};

export { RippleShader };
