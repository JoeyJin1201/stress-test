// (c) 2015 ULSee Inc.
// All rights reserved
// 2016.03.02 NewWay Added.

var BASIC_WARP_VERTEX = "precision highp float;\n" +
                        "attribute vec4 position;\n" +
                        "attribute vec2 textureCoord;\n" +
                        "uniform mat4 uMVPMatrix;\n" +
                        "varying highp vec2 texCoord;\n " +
                        "void main() {\n" +
                        "  texCoord = textureCoord;\n" +
                        "  gl_Position = uMVPMatrix * position;\n" +
                        "}";
var BASIC_WARP_FRAGMENT = "precision highp float;\n" +
                          "uniform sampler2D texture;\n" +
                          "varying highp vec2 texCoord;\n" +
                          "uniform float scaling;\n" +
                          "uniform float uAlpha;\n" +
                          "void main() {\n" +
                          "  //vec4 textureColor = texture2D(texture, vec2(texCoord.s, texCoord.t));\n" +
                          "  //gl_FragColor = vec4(textureColor.rgb, textureColor.a * uAlpha);\n" +

                          "     vec4 fragmentColor = texture2D(texture, texCoord);\n" +
                          "     fragmentColor.r = fragmentColor.r * fragmentColor.a * fragmentColor.a;\n" +
                          "     fragmentColor.g = fragmentColor.g * fragmentColor.a * fragmentColor.a;\n" +
                          "     fragmentColor.b = fragmentColor.b * fragmentColor.a * fragmentColor.a;\n" +
                          "     gl_FragColor = fragmentColor;\n" +

                          // "  gl_FragColor = texture2D(texture, texCoord);\n" +
                          "  //gl_FragColor = vec4(vec3(1),1.)*texture2D(texture, texCoord);\n" +
                          "  //gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);\n" +
                          "}";

var BASIC_ENV_WARP_VERTEX = "precision highp float;\n" +
                            "attribute vec4 position;\n" +
                            "attribute vec2 textureCoord;\n" +
                            "//uniform mat4 uMVPMatrix;\n" +
                            "uniform mat4 uMVMatrix;\n" +
                            "uniform mat4 uPMatrix;\n" +
                            "varying highp vec2 texCoord;\n " +
                            "void main() {\n" +
                            "  texCoord = textureCoord;\n" +
                            "  gl_Position = uPMatrix * uMVMatrix * position;\n" +
                            "  //gl_Position = uMVPMatrix * position;\n" +
                            "}";
var BASIC_ENV_WARP_FRAGMENT = "precision highp float;\n" +
                              "uniform sampler2D texture;\n" +
                              "varying highp vec2 texCoord;\n" +
                              "uniform float scaling;\n" +
                              "uniform float uAlpha;\n" +

                              "void main() {\n" +
                              "  //vec4 textureColor = texture2D(texture, vec2(texCoord.s, texCoord.t));\n" +
                              "  //gl_FragColor = vec4(textureColor.rgb, textureColor.a * uAlpha);\n" +
                              "  gl_FragColor = texture2D(texture, texCoord);\n" +
                              "  //gl_FragColor = vec4(vec3(1),1.)*texture2D(texture, texCoord);\n" +
                              "  //gl_FragColor = vec4(1.0, 0.0, 0.0, 0.5);\n" +
                              "}";


var BLEND_PER_PIXEL_VERTEX = 
    "attribute vec3 aVertexPosition;\n" +
    "attribute vec3 aVertexNormal;\n" +
    "attribute vec2 aTextureCoord;\n" +
    "//attribute float aFace;\n" +

    "uniform mat4 uMVMatrix;\n" +
    "uniform mat4 uPMatrix;\n" +
    "//uniform mat4 uMVPMatrix;\n" +
    "uniform mat3 uNMatrix;\n" +

    "varying vec2 vTextureCoord;\n" +
    "varying vec3 vTransformedNormal;\n" +
    "varying vec4 vPosition;\n" +

    "//varying float vFace;\n" +

    "void main(void) {\n" +
    "    vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);\n" +
    "    gl_Position = uPMatrix * vPosition;\n" +
    "    vTextureCoord = aTextureCoord;\n" +
    "    vTransformedNormal = uNMatrix * aVertexNormal;\n" +
    "//    vFace = aFace;\n" +
    "}";


var BLEND_PER_PIXEL_FRAGMENT =
    "precision mediump float;\n" +

    "varying vec4 vPosition;\n" +
    "varying vec2 vTextureCoord;\n" +
    "varying vec3 vTransformedNormal;\n" +

    "uniform bool uUseLight;\n" +
    "uniform bool uUseTextures;\n" +
    "uniform bool uUseEnvironmentTexture;\n" +
    "uniform bool uShowSpecularHighlights;\n" +
    "uniform bool uUseEnvironmentReflection;\n" +
    "uniform bool uUseEnvironmentReflectionAndTexture;\n" +

    "//uniform vec3 uAmbientColor;\n" +
    "//uniform vec3 uPointLightLocation;\n" +
    "//uniform vec3 uPointLightSpecularColor;\n" +
    "//uniform vec3 uPointLightDiffuseColor;\n" +

    "uniform sampler2D uTextureMapSampler;\n" +
    "uniform sampler2D uTextureBumpMapSampler;\n" +
    "//uniform sampler2D front;\n" +
    "//uniform sampler2D back;\n" +
    "//uniform sampler2D top;\n" +
    "//uniform sampler2D bottom;\n" +
    "//uniform sampler2D right;\n" +
    "//uniform sampler2D left;\n" +

    "uniform samplerCube uCubeSampler;\n" +

    "uniform float uMaterialShininess;\n" +

    "//varying float vFace;\n" +

    "uniform bool uOpticalLens;\n" +

    "void main(void) {\n" +

    "    //vec3 lightWeighting;\n" +
    "    //if (!uUseLight) {\n" +
            
    "    //    lightWeighting = vec3(1.0, 1.0, 1.0); // full brightness\n" +

    "    //} else {\n" +

    "    //    vec3 lightDirection = normalize(uPointLightLocation - vPosition.xyz);\n" +
    "    //    vec3 normal = normalize(vTransformedNormal);\n" +

    "    //    float specularLightWeighting = 0.0;\n" +
    "    //    vec3 eyeDirection = normalize(-vPosition.xyz);\n" +
    "    //    vec3 reflectionDirection = reflect(-lightDirection, normal);\n" +

    "    //    if (uShowSpecularHighlights) {\n" +

    "    //        // specular highlighting + bump mapping\n" +
    "    //        float shininess = texture2D(uTextureBumpMapSampler, vec2(vTextureCoord.s, vTextureCoord.t)).r * 255.0 / uMaterialShininess;\n" +
    "    //        if (shininess < 255.0) {\n" +
    "    //            specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), shininess * 2.0);\n" +
    "    //        }\n" +
    "    //    } else {\n" +

    "    //        // just specular highlighting\n" +
    "    //        specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);\n" +
    "    //    }\n" +

    "    //    float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);\n" +
    "    //    lightWeighting = uAmbientColor\n" +
    "    //        + uPointLightSpecularColor * specularLightWeighting\n" +
    "    //        + uPointLightDiffuseColor * diffuseLightWeighting;\n" +
    "    //}\n" +

    "    vec4 fragmentColor;\n" +
    "    //if (uUseTextures) {\n" +

    "    //    if (vFace < 0.1) {\n" +

    "            vec4 textureValue = texture2D(uTextureMapSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n" +

    "            if( uOpticalLens ) {\n" +
    "               textureValue.r = textureValue.r / textureValue.a;\n" +
    "               textureValue.g = textureValue.g / textureValue.a;\n" +
    "               textureValue.b = textureValue.b / textureValue.a;\n" +
    "            }\n" +
    "            else {\n" +
    "               textureValue.r = textureValue.r * textureValue.a * textureValue.a;\n" +
    "               textureValue.g = textureValue.g * textureValue.a * textureValue.a;\n" +
    "               textureValue.b = textureValue.b * textureValue.a * textureValue.a;\n" +
    "            }\n" +

    "            //if (uUseEnvironmentReflection) {\n" +

    "                vec3 normal = normalize(vTransformedNormal);\n" +
    "                vec3 eyeDirection = vec3(-vPosition.xy, 0.3);\n" +
    "                vec3 lookup = reflect(eyeDirection, normal);\n" +
    "                fragmentColor = textureCube(uCubeSampler, -lookup);\n" +

    "             //   if (uUseEnvironmentReflectionAndTexture) {\n" +

    "                    fragmentColor = fragmentColor * textureValue;\n" +

    "              //  }\n" +

    "            //} else {\n" +
    "            //    fragmentColor = textureValue;\n" +
    "            //}\n" +

    "    //    } else if (vFace < 1.1) {\n" +
    "    //        fragmentColor = texture2D(front, vTextureCoord);\n" +
    "    //    } else if (vFace < 2.1) {\n" +
    "    //        fragmentColor = texture2D(back, vTextureCoord);\n" +
    "    //    } else if (vFace < 3.1) {\n" +
    "    //        fragmentColor = texture2D(top, vTextureCoord);\n" +
    "    //    } else if (vFace < 4.1) {\n" +
    "    //        fragmentColor = texture2D(bottom, vTextureCoord);\n" +
    "    //    } else if (vFace < 5.1) {\n" +
    "    //        fragmentColor = texture2D(right, vTextureCoord);\n" +
    "    //    } else {\n" +
    "    //        fragmentColor = texture2D(left, vTextureCoord);\n" +
    "    //    }\n" +

    "    //} else {\n" +

    "    //    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0); // white\n" +
    "    //}\n" +

    "    //gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);\n" +
    "    gl_FragColor = vec4(fragmentColor.rgb, fragmentColor.a);\n" +
    "}";
