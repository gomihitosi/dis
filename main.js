const PALETTE = {
  PC88: [
    [0, 0, 0],
    [0, 0, 255],
    [255, 0, 0],
    [255, 0, 255],
    [0, 255, 0],
    [0, 255, 255],
    [255, 255, 0],
    [255, 255, 255],
  ],
  GB_GREEN: [
    [0, 64, 8],
    [44, 116, 41],
    [139, 193, 7],
    [159, 209, 052],
  ],
  GB_MONOCHROME: [
    [0, 0, 0],
    [85, 85, 85],
    [170, 170, 170],
    [255, 255, 255],
  ],
  BLACK_WHITE: [
    [0, 0, 0],
    [255, 255, 255],
  ],
  AYY4: [
    [0, 48, 59],
    [255, 119, 119],
    [255, 206, 150],
    [241, 242, 218],
  ],
  BLK_AQU4: [
    [0, 43, 89],
    [0, 95, 140],
    [0, 185, 190],
    [159, 244, 229],
  ],
  SPACEHAZE: [
    [248, 227, 196],
    [204, 52, 149],
    [107, 31, 177],
    [11, 6, 48],
  ],
  CRIMSON: [
    [239, 249, 214],
    [186, 80, 68],
    [122, 28, 75],
    [27, 3, 38],
  ],
};
const CAMERA = {
  FRONT: "user",
  REAR: {
    exact: "environment",
  },
};

let isStart = false;
let contrast = 0;
let step = 2;
let palette = "GB_GREEN";
let camera = "FRONT";

let stream = null;

const ditherjs = new DitherJS({
  step,
  palette: PALETTE[palette],
});

const start = document.getElementById("start");
const cameraDom = document.getElementById("camera");
const paletteDom = document.getElementById("palette");
const stepDom = document.getElementById("step");
const stepValue = document.getElementById("stepValue");
const contrastDom = document.getElementById("contrast");
const contrastValue = document.getElementById("contrastValue");

cameraDom.addEventListener("input", (e) => {
  camera = e.target.value;
  if (isStart) {
    isStart = false;
    start.innerText = "start";
    stream.getVideoTracks().forEach((camera) => {
      camera.stop();
    });
    stream = null;
  }
});

paletteDom.addEventListener("input", (e) => {
  ditherjs.options.palette = PALETTE[e.target.value];
});

stepDom.addEventListener("input", (e) => {
  ditherjs.options.step = e.target.valueAsNumber;
  stepValue.innerText = ditherjs.options.step;
});

contrastDom.addEventListener("input", (e) => {
  contrast = e.target.valueAsNumber;
  contrastValue.innerText = contrast;
});

Array.from(paletteDom.options).filter(
  (v) => v.value === palette
)[0].selected = true;
stepDom.value = step;
stepValue.innerText = step;
contrastDom.value = contrast;
contrastValue.innerText = contrast;

start.addEventListener("click", (e) => {
  isStart = !isStart;
  start.innerText = isStart ? "stop" : "start";
  if (isStart) {
    main();
  } else {
    stream.getVideoTracks().forEach((camera) => {
      camera.stop();
    });
  }
});

const main = async () => {
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const offscreen = document.createElement("canvas");
  const offscreenCtx = offscreen.getContext("2d");

  const video = document.createElement("video");
  video.setAttribute("autoplay", "");
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 640,
        height: 320,
        facingMode: CAMERA[camera],
      },
    });
  } catch (e) {
    alert(
      "カメラの起動に失敗しました。カメラへのアクセスを許可するか、リア/フロントを切り替えたら上手く行くかもしれません"
    );
    isStart = false;
    start.innerText = "start";
  }

  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();
    canvas.width = video.videoWidth;
    offscreen.width = video.videoWidth;
    canvas.height = video.videoHeight;
    offscreen.height = video.videoHeight;
    draw();
  };
  const draw = () => {
    if (!isStart) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    offscreenCtx.drawImage(video, 0, 0);
    const imageData = offscreenCtx.getImageData(
      0,
      0,
      offscreen.width,
      offscreen.height
    );

    let d = imageData.data;
    const newContrast = contrast / 100 + 1;
    const intercept = 128 * (1 - newContrast);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = d[i] * newContrast + intercept;
      d[i + 1] = d[i + 1] * newContrast + intercept;
      d[i + 2] = d[i + 2] * newContrast + intercept;
    }
    ditherjs.ditherImageData(imageData);
    offscreenCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(offscreen, 0, 0);
    window.requestAnimationFrame(draw);
  };
};
