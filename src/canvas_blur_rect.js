!function(window) {

  'use strict';

  var blurCanvas = document.createElement('canvas');
  blurCanvas.width = screen.width;
  blurCanvas.height = screen.height;
  var blurCtx = blurCanvas.getContext('2d');


  function boxBlur(src, w, h, r) {
    var tmp = new Uint8Array(w * h * 4);
    blurRight(src, tmp, w, h, r);
    blurDown(tmp, src, w, h, r);
    blurLeft(src, tmp, w, h, r);
    blurUp(tmp, src, w, h, r);
  };

  function blurRight(src, dest, w, h, r) {

    var i, j, offset, pos, posR;

    var shiftR = r << 2;
    var shiftW = w << 2;

    var weightR, weightG, weightB, weightA;

    for(j = 0; j < h; j++) {

      weightR = 0;
      weightG = 0;
      weightB = 0;
      weightA = 0;

      offset = j * shiftW;

      for(i = 0; i < r; i++) {

        pos = offset + (i << 2);

        weightR += src[pos];
        weightG += src[pos + 1];
        weightB += src[pos + 2];
        weightA += src[pos + 3];

        dest[pos] = (weightR / (i + 1)) | 0;
        dest[pos + 1] = (weightG / (i + 1)) | 0;
        dest[pos + 2] = (weightB / (i + 1)) | 0;
        dest[pos + 3] = (weightA / (i + 1)) | 0;

      }

      for(; i < w; i++) {

        pos = offset + (i << 2);
        posR = pos - shiftR;

        dest[pos] = (weightR / r) | 0;
        dest[pos + 1] = (weightG / r) | 0;
        dest[pos + 2] = (weightB / r) | 0;
        dest[pos + 3] = (weightA / r) | 0;

        weightR += src[pos] - src[posR];
        weightG += src[pos + 1] - src[posR + 1];
        weightB += src[pos + 2] - src[posR + 2];
        weightA += src[pos + 3] - src[posR + 3];

      }

    }

  };

  function blurLeft(src, dest, w, h, r) {

    var i, j, offset, pos, posR;

    var shiftR = r << 2;
    var shiftW = w << 2;

    var weightR, weightG, weightB, weightA;

    for(j = 0; j < h; j++) {

      weightR = 0;
      weightG = 0;
      weightB = 0;
      weightA = 0;

      offset = j * shiftW;

      for(i = w - 1; i >= w - r; i--) {

        pos = offset + (i << 2);

        weightR += src[pos];
        weightG += src[pos + 1];
        weightB += src[pos + 2];
        weightA += src[pos + 3];

        dest[pos] = (weightR / (w - i)) | 0;
        dest[pos + 1] = (weightG / (w - i)) | 0;
        dest[pos + 2] = (weightB / (w - i)) | 0;
        dest[pos + 3] = (weightA / (w - i)) | 0;

      }

      for(; i >= 0; i--) {

        pos = offset + (i << 2);
        posR = pos + shiftR;

        dest[pos] = (weightR / r) | 0;
        dest[pos + 1] = (weightG / r) | 0;
        dest[pos + 2] = (weightB / r) | 0;
        dest[pos + 3] = (weightA / r) | 0;

        weightR += src[pos] - src[posR];
        weightG += src[pos + 1] - src[posR + 1];
        weightB += src[pos + 2] - src[posR + 2];
        weightA += src[pos + 3] - src[posR + 3];

      }

    }

  };

  function blurDown(src, dest, w, h, r) {

    var i, j, offset, pos, posR;

    var shiftR = r << 2;
    var shiftW = w << 2;

    var offsetR = shiftW * r;

    var weightR, weightG, weightB, weightA;

    for(i = 0; i < w; i++) {

      weightR = 0;
      weightG = 0;
      weightB = 0;
      weightA = 0;

      offset = i << 2;

      for(j = 0; j < r; j++) {

        pos = offset + (j * shiftW);

        weightR += src[pos];
        weightG += src[pos + 1];
        weightB += src[pos + 2];
        weightA += src[pos + 3];

        dest[pos] = (weightR / (j + 1)) | 0;
        dest[pos + 1] = (weightG / (j + 1)) | 0;
        dest[pos + 2] = (weightB / (j + 1)) | 0;
        dest[pos + 3] = (weightA / (j + 1)) | 0;

      }

      for(; j < h; j++) {

        pos = offset + (j * shiftW);
        posR = pos - offsetR;

        dest[pos] = (weightR / r) | 0;
        dest[pos + 1] = (weightG / r) | 0;
        dest[pos + 2] = (weightB / r) | 0;
        dest[pos + 3] = (weightA / r) | 0;

        weightR += src[pos] - src[posR];
        weightG += src[pos + 1] - src[posR + 1];
        weightB += src[pos + 2] - src[posR + 2];
        weightA += src[pos + 3] - src[posR + 3];

      }

    }

  };

  function blurUp(src, dest, w, h, r) {

    var i, j, offset, pos, posR;

    var shiftR = r << 2;
    var shiftW = w << 2;

    var offsetR = shiftW * r;

    var weightR, weightG, weightB, weightA;

    for(i = 0; i < w; i++) {

      weightR = 0;
      weightG = 0;
      weightB = 0;
      weightA = 0;

      offset = i << 2;

      for(j = h - 1; j >= h - r; j--) {

        pos = offset + (j * shiftW);

        weightR += src[pos];
        weightG += src[pos + 1];
        weightB += src[pos + 2];
        weightA += src[pos + 3];

        dest[pos] = (weightR / (h - j)) | 0;
        dest[pos + 1] = (weightG / (h - j)) | 0;
        dest[pos + 2] = (weightB / (h - j)) | 0;
        dest[pos + 3] = (weightA / (h - j)) | 0;

      }

      for(; j >= 0; j--) {

        pos = offset + (j * shiftW);
        posR = pos + offsetR;

        dest[pos] = (weightR / r) | 0;
        dest[pos + 1] = (weightG / r) | 0;
        dest[pos + 2] = (weightB / r) | 0;
        dest[pos + 3] = (weightA / r) | 0;

        weightR += src[pos] - src[posR];
        weightG += src[pos + 1] - src[posR + 1];
        weightB += src[pos + 2] - src[posR + 2];
        weightA += src[pos + 3] - src[posR + 3];

      }

    }

  };

  function blurRect(x, y, w, h,cw,ch, r) {

    var ctx = this;
    var canvas = ctx.canvas;

    var srcW = w | 0;
    var srcH = h | 0;

    var srcX = x | 0;
    var srcY = y | 0;

    /*r = (r | 0) * 32;
    r = Math.min(Math.max(r, 32), 256);*/

    var resizeFactor =0;
    var radius = r >>> resizeFactor;

    var resizeWidth = cw;
    var resizeHeight = ch;
    blurCanvas.width = cw;
    blurCanvas.height = ch;
    blurCtx = blurCanvas.getContext('2d');

    blurCtx.drawImage(canvas, 0, 0, resizeWidth, resizeHeight);
    var imageData = blurCtx.getImageData(0, 0, resizeWidth, resizeHeight);

    boxBlur(imageData.data, resizeWidth, resizeHeight, radius);

    blurCtx.putImageData(imageData, 0, 0);

    blurCtx.drawImage(
      blurCanvas,
      0, 0,
      resizeWidth, resizeHeight,
      0, 0,
      resizeWidth, resizeHeight
    );

    ctx.drawImage(
      blurCanvas,
      srcX, srcY,
      srcW, srcH,
      srcX, srcY,
      srcW, srcH
    );

    return ctx;

  };

  window.CanvasRenderingContext2D.prototype._blurRect = blurRect;

}(window);
