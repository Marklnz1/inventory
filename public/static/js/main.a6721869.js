/*! For license information please see main.a6721869.js.LICENSE.txt */
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
`,ml=ro`
  0% {
    stroke-dasharray: 1px, 200px;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -15px;
  }

  100% {
    stroke-dasharray: 100px, 200px;
    stroke-dashoffset: -125px;
  }
`,gl="string"!==typeof hl?ao`
        animation: ${hl} 1.4s linear infinite;
      `:null,yl="string"!==typeof ml?ao`
        animation: ${ml} 1.4s ease-in-out infinite;
//# sourceMappingURL=main.a6721869.js.map