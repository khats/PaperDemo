(function ($) {
    $.ter = $.ter || {};
    $.ter.Image = function () {
        var context = $(document);
        var options = {
            uploadUrl: null
        };

        var initPaper = function (containerId) {
            if (!paper.project) {
                paper.setup(containerId);
            } else {
                userImage = null;
                resizePoints = [];
                resizePoints2 = [];
                while (paper.projects.length) {
                    paper.projects[0].remove();
                }
                paper.setup(containerId);
            }
        };

        var imageReader = typeof (FileReader) == 'function' ? new FileReader() : (typeof (FileReader) == 'object' ? new FileReader() : null);
        var userImage = null;
        var getUserMask = function () {
            return paper.projects[0].activeLayer.children[2];
        };
        var getUserMask2 = function () {
            return paper.projects[0].activeLayer.children[8];
        };
        var resizePoints = [];
        var resizePoints2 = [];
        var mask2Active = false;
        var coords = {};

        var maskExist = function () {
            return paper.projects.length && paper.projects[0].activeLayer.children.length > 2;
        };
        var mask2Exist = function () {
            return paper.projects.length && paper.projects[0].activeLayer.children.length > 8;
        };
        var loadImage = function (imageData) {
            var userImage = new Image();
            userImage.onload = setUserImage;
            userImage.onerror = imageLoadError;
            userImage.src = imageData;
            if (userImage.complete || userImage.complete === undefined) {
                var src = userImage.src;
                // webkit hack from http://groups.google.com/group/jquery-dev/browse_thread/thread/eee6ab7b2da50e1f
                // data uri bypasses webkit log warning (thx doug jones)
                userImage.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                userImage.src = src;
            }
        };

        var imageLoadError = function () {
            console.log('error loading image')
        };

        var loadImageFromDisk = function (file) {
            imageReader.readAsDataURL(file);
        };

        var isImageFileType = function (file) {
            var typeMatch = file.type.match(/image\/(.*)/);
            return (typeMatch && ['png', 'gif', 'jpg', 'jpeg'].indexOf(typeMatch[1]) > -1);
        };

        var addImage = function (image, fillBg) {
            if (fillBg) {
                var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(image.width, image.height));
                var path = new paper.Path.Rectangle(rectangle);
                path.fillColor = '#fff';
            }
            var imageModel = new paper.Raster(image.src, 0, 0);
            return imageModel;
        };

        var setUserImage = function () {
            if (userImage) {
                userImage.remove();
                userImage = null;
            }
            var TO_RADIANS = Math.PI / 180;
            function rotateAndPaintImage(cnvContext, image, angle, positionX, positionY) {
                cnvContext.save();
                cnvContext.translate(positionX, positionY);
                cnvContext.rotate(angle * TO_RADIANS);
                cnvContext.drawImage(image, -image.width / 2, -(image.height / 2));
                cnvContext.restore();
            }

            EXIF.getData(this, function () {
                var imageOrientation = EXIF.getTag(this, 'Orientation');
                if (imageOrientation && imageOrientation == 6) {
                    var img1 = new Image;
                    img1.onload = function () {
                        var $cnv = $('.js-image-meta-fixer');
                        var cnv = $cnv[0];
                        cnv.width = this.height;
                        cnv.height = this.width;

                        var cnvContext = cnv.getContext('2d');
                        var x = cnv.width / 2;
                        var y = cnv.height / 2;
                        rotateAndPaintImage(cnvContext, img1, 90, x, y);
                        loadImage($cnv[0].toDataURL('image/jpeg', 0.5));
                    }
                    img1.src = this.src;
                } else {
                    $('.js-crop-img').attr('src', this.src);
                    coords={
                        x:0,
                        y: 0,
                        w:this.width,
                        h: this.height
                    }
                }
            });
        };

        var setUserMask = function (maskImage) {

            function rotateNormalize(is2Mask) {
                var resPoints = is2Mask ? resizePoints2 : resizePoints;
                var activeMask = is2Mask ? getUserMask2() : getUserMask();
                var rotation = activeMask.matrix.rotation;
                activeMask.rotate(-rotation, activeMask.position);
                resPoints[0].rotate(-rotation);
                resPoints[1].rotate(-rotation);
                resPoints[2].rotate(-rotation);
                resPoints[3].rotate(-rotation);
                resPoints[4].rotate(-rotation);
                return rotation;
            }
            function restoreRotate(rotation, is2Mask) {
                var resPoints = is2Mask ? resizePoints2 : resizePoints;
                var activeMask = is2Mask ? getUserMask2() : getUserMask();
                activeMask.rotate(rotation, activeMask.position);
                resPoints[0].rotate(rotation, activeMask.position);
                resPoints[1].rotate(rotation, activeMask.position);
                resPoints[2].rotate(rotation, activeMask.position);
                resPoints[3].rotate(rotation, activeMask.position);
                resPoints[4].rotate(rotation, activeMask.position);

            }
            function recalcPoints(is2Mask) {
                var resPoints = is2Mask ? resizePoints2 : resizePoints;
                var activeMask = is2Mask ? getUserMask2() : getUserMask();
                var rotation = rotateNormalize(is2Mask);
                var xscale = activeMask.matrix.scaling.x;
                var yscale = activeMask.matrix.scaling.y;
                resPoints[0].position.x = activeMask.position.x - ((activeMask.size.width / 2) * xscale);
                resPoints[0].position.y = activeMask.position.y;
                resPoints[1].position.x = activeMask.position.x;
                resPoints[1].position.y = activeMask.position.y - ((activeMask.size.height / 2) * yscale);
                resPoints[2].position.x = activeMask.position.x + ((activeMask.size.width / 2) * xscale);
                resPoints[2].position.y = activeMask.position.y;
                resPoints[3].position.x = activeMask.position.x;
                resPoints[3].position.y = activeMask.position.y + ((activeMask.size.height / 2) * yscale);
                resPoints[4].position.x = activeMask.position.x;
                resPoints[4].position.y = activeMask.position.y + ((activeMask.size.height / 2) * yscale) + 50;

                restoreRotate(rotation, is2Mask);

            }
            function getPoint(x, y) {
                var point = new paper.Path.Circle(new paper.Point(x, y), 7);
                point.fillColor = 'white';
                point.strokeColor = 'black';
                return point;
            }

            if (!maskImage) {
                return;
            }
            var activeMask = mask2Active ? getUserMask2() : getUserMask();
            var resPoints = mask2Active ? resizePoints2 : resizePoints;

            if (activeMask) {
                activeMask.source = maskImage.src;
            } else {
                var img = new Image();
                img.src = maskImage.src;
                activeMask = addImage(maskImage);

                activeMask.position = paper.view.center;
                activeMask.scale(1 / 2, 1 / 2);
                paper.view.update();
                var mask2 = mask2Active;
                activeMask.onMouseDrag = function (e) {
                    this.position = e.point;
                    recalcPoints(mask2);
                };
                var circlePathLeft = getPoint(activeMask.position.x - activeMask.size.width / 2, activeMask.position.y);
                circlePathLeft.onMouseDrag = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var rotation = activeMask.matrix.rotation;
                    activeMask.rotate(-rotation, activeMask.position);
                    e.point = e.point.rotate(-rotation, activeMask.position);
                    this.rotate(-rotation, activeMask.position);

                    activeMask.scale(this.position.x / e.point.x, 1);

                    this.rotate(rotation, activeMask.position);
                    activeMask.rotate(rotation, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathLeft);
                var circlePathTop = getPoint(activeMask.position.x, activeMask.position.y - activeMask.size.height / 2);
                circlePathTop.onMouseDrag = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var rotation = activeMask.matrix.rotation;
                    activeMask.rotate(-rotation, activeMask.position);
                    e.point = e.point.rotate(-rotation, activeMask.position);
                    this.rotate(-rotation, activeMask.position);

                    activeMask.scale(1, this.position.y / e.point.y);

                    this.rotate(rotation, activeMask.position);
                    activeMask.rotate(rotation, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathTop);
                var circlePathRight = getPoint(activeMask.position.x + activeMask.size.width / 2, activeMask.position.y);
                circlePathRight.onMouseDrag = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var rotation = activeMask.matrix.rotation;
                    activeMask.rotate(-rotation, activeMask.position);
                    e.point = e.point.rotate(-rotation, activeMask.position);
                    this.rotate(-rotation, activeMask.position);

                    activeMask.scale(e.point.x / this.position.x, 1);

                    this.rotate(rotation, activeMask.position);
                    activeMask.rotate(rotation, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathRight);
                var circlePathBottom = getPoint(activeMask.position.x, activeMask.position.y + activeMask.size.height / 2);
                circlePathBottom.onMouseDrag = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var rotation = activeMask.matrix.rotation;
                    activeMask.rotate(-rotation, activeMask.position);
                    e.point = e.point.rotate(-rotation, activeMask.position);
                    this.rotate(-rotation, activeMask.position);

                    activeMask.scale(1, e.point.y / this.position.y);

                    this.rotate(rotation, activeMask.position);
                    activeMask.rotate(rotation, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathBottom);
                var circlePathRotate = getPoint(activeMask.position.x, activeMask.position.y + activeMask.size.height / 2 + 50);
                circlePathRotate.onMouseDrag = function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var vectorCenter = new paper.Point(activeMask.position.x, activeMask.position.y);
                    var vectorSrc = new paper.Point(this.position.x, this.position.y);
                    var vectorDestinaion = new paper.Point(e.point.x, e.point.y);
                    var vectorCenterSrc = vectorSrc.subtract(vectorCenter);
                    var vectorCenterDest = vectorDestinaion.subtract(vectorCenter);
                    var angle = vectorCenterDest.angle - vectorCenterSrc.angle;
                    activeMask.rotate(angle, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathRotate);
                recalcPoints(mask2Active);
                paper.view.update();
            }
        };

        var initUploadStep = function () {
            var container = $('.js-image-editor-container');
            container.on('change', '.js-load-from-disk input[type=file]', function () {
                var file = this.files[0];
                if (!isImageFileType(file)) {
                    return;
                } else {
                }
                if (file.size && file.size > 5242880) {
                    return;
                } else {
                }
                loadImageFromDisk(file);
            });
        };

        var initMaskStep = function () {
            $('.js-mask').on('click', function () {
                if (!mask2Exist()) {
                    if (!$('.js-add-2nd-mask-select').hasClass('hidden')) {
                        mask2Active = true;
                        $('.js-add-2nd-mask-select').addClass('hidden');

                    }
                    setUserMask(this);
                    if (paper.projects[0].activeLayer.children.length == 8) {
                        $('.js-add-2nd-mask').removeClass('hidden');
                    }
                } else {
                    setUserMask(this);
                }
            });
        };
        var init2ndMaskStep = function () {
            $('.js-image-editor-container').on('click', '.js-add-photo-modal-step3 .js-add-2nd-mask', function () {
                $('.js-add-2nd-mask').addClass('hidden');
                $('.js-add-2nd-mask-select').removeClass('hidden');
            });
        };
        var bindBlurPhoto = function () {
            $('.js-blur').on('click', function () {
                if (paper.projects.length > 0) {
                    for (var i = 0; i < paper.projects.length; i++) {
                        if (paper.projects[i].activeLayer.children.length > 2) {
                            var children = paper.projects[i].activeLayer.children;
                            for (var j = children.length - 1 ; j > 1; j--) {
                                children[j].remove();
                            }
                        }
                    }
                }
                resizePoints = [];
                resizePoints2 = [];
                mask2Active = false;
                $('.js-add-2nd-mask, .js-add-2nd-mask-select').addClass('hidden');
                var deep = $(this).data('opacity');
                options.blurDeep = deep;
                var img = options.cropedImage;
                var $canvas = $('.js-image-preview');
                var canvasContext = $canvas[0].getContext('2d');
                canvasContext.drawImage(img, 0, 0, $canvas.width(), $canvas.height());
                if (deep != 0) {
                    canvasContext._blurRect(0, 0, $canvas.width(), $canvas.height(), $canvas.width(), $canvas.height(), deep);
                }
            });
        };


        var bindEditPhotoModal = function () {
            $('.js-create-previews').on('click', function () {
                var maxSize = 5000000;
                mask2Active = false;
                $('.js-add-2nd-mask').addClass('hidden');

                var img = $('.js-crop-img')[0];
                var $canvas = $('.js-image-preview');
                initPaper($canvas[0]);
                $canvas.css('width', img.width);
                $canvas.css('height', img.height);
                userImage = addImage(img, true);
                paper.view.size.setWidth(img.width);
                paper.view.size.setHeight(img.height);
                var canvasSize = img.width * img.height;
                if (canvasSize > maxSize) {
                    paper.view.viewSize.setWidth(Math.floor(img.width * maxSize/ canvasSize));
                    paper.view.viewSize.setHeight(Math.floor(img.height * maxSize / canvasSize));
                } else {
                    paper.view.viewSize.setWidth(img.width);
                    paper.view.viewSize.setHeight(img.height);
                }
                paper.view.setCenter(img.width / 2, img.height / 2);

                userImage.position = paper.view.center;
                var cropedRaster = userImage.getSubRaster(new paper.Rectangle(coords.x, coords.y, coords.w - 5, coords.h - 5));
                userImage.remove();
                userImage = cropedRaster;

                $canvas.css('width', coords.w);
                $canvas.css('height', coords.h);
                paper.view.size.width = coords.w;
                paper.view.size.height = coords.h;
                paper.view.viewSize.width = coords.w;
                paper.view.viewSize.height = coords.h;
                paper.view.setCenter(coords.w / 2, coords.h / 2);
                userImage.position = paper.view.center;
                cropedRaster.scale(1, 1);
                paper.view.update();



                var thumbCanvas = $('.js-image-thumb')[0].getContext('2d');
                var kk = cropedRaster.width / cropedRaster.height;
                var thumbW = 50;
                var thumbH = Math.round(thumbW / kk);

                var ss = new Image();
                ss.onload = function () {
                    ss.width = thumbW;
                    ss.height = thumbH;
                    $('.js-image-thumb')[0].width = thumbW;
                    $('.js-image-thumb')[0].height = thumbH;
                    $('.js-image-thumb').css('width', thumbW);
                    $('.js-image-thumb').css('height', thumbH);
                    thumbCanvas.drawImage(ss, 0, 0, thumbW, thumbH);
                    $('.js-blur').each(function () {
                        var deep = $(this).data('opacity');
                        var $thumb = $('.js-image-thumb');
                        var thumb = $thumb[0];
                        thumbCanvas.drawImage(ss, 0, 0, thumbW, thumbH);
                        if (deep != 0) {
                            thumbCanvas._blurRect(0, 0, thumbW, thumbH, thumbW, thumbH, deep);
                        }

                        $(this).attr('src', thumb.toDataURL('image/jpeg', 0.5));
                        $(this).css('height', thumbH + 'px');
                    });
                }

                //TODO: Dirty fix, raster with new image is not ready yet, see https://github.com/paperjs/paper.js/issues/924
                setTimeout(function () {
                    options.cropedSrc = $('.js-image-preview')[0].toDataURL('image/jpeg', 0.5);
                    options.cropedImage = new Image();
                    options.cropedImage.src = options.cropedSrc;
                    ss.src = options.cropedSrc;
                }, 1000);
                var $canvasOrig = $('.js-image-orig');
                var computedSize = coords.w * coords.h;
                if (computedSize > maxSize) {
                    $('.js-image-orig').css('width', Math.round(coords.w * maxSize/ computedSize));
                    $('.js-image-orig').css('height', Math.round(coords.h * maxSize / computedSize));
                } else {
                    $('.js-image-orig').css('width', coords.w);
                    $('.js-image-orig').css('height', coords.h);
                }

                paper.setup($canvasOrig[0]);
                paper.projects[1].activate();
                paper.projects[0].activeLayer.children[0].copyTo(paper.projects[1]);
                paper.projects[0].activeLayer.children[1].copyTo(paper.projects[1]);

                paper.view.update();
                paper.projects[0].activate();

                var $maxSize = 500;
                var origW = $canvas.width();
                var koef = coords.w / coords.h;
                var w = $maxSize;
                $canvas.css('width', w);
                $canvas.css('height', w / koef);
                options.koef = w / origW;
                paper.view.size = new paper.Size($canvas.width(), $canvas.height());
                paper.view.viewSize = new paper.Size($canvas.width(), $canvas.height());
                userImage.scale($canvas.width() / userImage.size.width, $canvas.height() / userImage.size.height);
                paper.view.setCenter($canvas.width() / 2, $canvas.height() / 2);
                userImage.position = paper.view.center;
                paper.view.update();
            });
        };
        var bindPreviewModal = function () {
            var imgData;
            $('.js-image-editor-container').on('shown.bs.modal', '.js-add-photo-modal-step4', function () {
                $('.js-add-photo-modal-step4 .modal-body').hide();
                $('.js-image-result')[0].onload = function() {
                    $('.js-add-photo-modal-step4 .modal-body').show();
                }
                var $canvas = $('.js-image-preview');
                var $canvasOrig = $('.js-image-orig');
                if (paper.projects.length) {
                    var mask;
                    var sc;
                    var children = paper.projects[1].activeLayer.children;
                    for (var j = children.length - 1; j > 1; j--) {
                        children[j].remove();
                    }
                    if (maskExist() && getUserMask()) {
                        mask = getUserMask().copyTo(paper.projects[1]);
                        sc = paper.projects[1].view.size.width / paper.projects[0].view.size.width;
                        mask.position.x *= sc;
                        mask.position.y *= sc;
                        mask.scale(sc);

                    }
                    if (mask2Exist() && getUserMask2()) {
                        mask = getUserMask2().copyTo(paper.projects[1]);
                        sc = paper.projects[1].view.size.width / paper.projects[0].view.size.width;
                        mask.position.x *= sc;
                        mask.position.y *= sc;
                        mask.scale(sc);
                    }
                    if (maskExist() || mask2Exist()) {
                        paper.projects[1].activate();
                        paper.view.update();
                        paper.projects[0].activate();
                    } else {
                        var canvasContextOrig = $canvasOrig[0].getContext('2d');
                        canvasContextOrig.drawImage(options.cropedImage, 0, 0, $canvasOrig.width(), $canvasOrig.height());
                        if (options.blurDeep != 0) {
                            canvasContextOrig._blurRect(0, 0, $canvasOrig.width(), $canvasOrig.height(), $canvasOrig.width(), $canvasOrig.height(), options.blurDeep * ($canvasOrig.width() / $canvas.width()));
                        }
                    }
                    imgData = $canvasOrig[0].toDataURL('image/jpeg', 0.5);
                    $('.js-image-result').attr('src', imgData);
                } else {
                    var img = $('.js-add-photo-modal-step2 .js-crop-container img.js-crop-img')[0];
                    initPaper($canvas[0]);
                    $canvas.css('width', img.width);
                    $canvas.css('height', img.height);
                    userImage = addImage(img, true);
                    paper.view.size.setWidth(img.width);
                    paper.view.size.setHeight(img.height);
                    paper.view.viewSize.setWidth(img.width);
                    paper.view.viewSize.setHeight(img.height);
                    paper.view.setCenter(img.width / 2, img.height / 2);
                    userImage.position = paper.view.center;
                    var cropedRaster = userImage.getSubRaster(new paper.Rectangle(coords.x, coords.y, coords.w, coords.h));
                    userImage.remove();
                    userImage = cropedRaster;
                    $canvas.css('width', coords.w);
                    $canvas.css('height', coords.h);
                    paper.view.size.width = coords.w;
                    paper.view.size.height = coords.h;
                    paper.view.viewSize.width = coords.w;
                    paper.view.viewSize.height = coords.h;
                    paper.view.setCenter(coords.w / 2, coords.h / 2);
                    userImage.position = paper.view.center;
                    cropedRaster.scale(1, 1);
                    paper.view.update();
                    imgData = $('.js-image-preview')[0].toDataURL('image/jpeg', 0.5);
                    paper.projects.forEach(function (proj) {
                        proj.remove();
                    });
                    $('.js-image-result').attr('src', imgData);
                }
            });
            $('.js-image-editor-container').on('click', '.js-add-photo-modal-step4 .js-use-photo', function () {
                $.post(options.uploadUrl, {
                        image: imgData.split(',')[1]
                    })
                    .success(function (data) {
                        options.saveContext.trigger('mlr-image.callback', data);
                    });
            });
        };


        var init = this.init = function (ctx, opts) {
            context = ctx || context;
            $.extend(options, opts);
            imageReader.onload = function (e) {
                loadImage(e.target.result);
            };
            initUploadStep();
            initMaskStep();
            init2ndMaskStep();
            bindEditPhotoModal();
            bindBlurPhoto();
            bindPreviewModal();
        };
        return this;
    };
})(jQuery);