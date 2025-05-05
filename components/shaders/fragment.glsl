varying vec3 v_Normal;
varying vec3 vViewPosition;

uniform samplerCube envMap;
uniform float time;
uniform float opacity;
uniform float reflectivity;
uniform float refractiveIndex;
uniform vec3 baseColor;
uniform float baseColorIntensity;

const float FresnelPower = 2.;

void main()
{
    // Fresnel effect
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1. - dot(v_Normal, viewDir), FresnelPower);
    fresnel = reflectivity + (1. - reflectivity) * fresnel;

    // Refraction & Reflection
    vec3 refracted = refract(viewDir, v_Normal, refractiveIndex);
    vec3 reflected = reflect(viewDir, v_Normal);

    // Mix in color
    vec4 envColorRefract = textureCube(envMap, refracted);
    vec3 tintedRefraction = envColorRefract.rgb * baseColor;
    vec3 surfaceColor = mix(envColorRefract.rgb, tintedRefraction, baseColorIntensity);

    vec4 envColorReflect = textureCube(envMap, reflected);

    // Combine
    vec4 finalColor;
    finalColor.rgb = mix(surfaceColor, envColorReflect.rgb, fresnel);
    finalColor.a = opacity * (1. - fresnel);

    // Specular Highlights
    float specular = pow(fresnel, 32.);
    finalColor.rgb += vec3(specular) * 0.5;

    gl_FragColor = finalColor;
    // gl_FragColor = vec4(v_Normal, 0.7);
}