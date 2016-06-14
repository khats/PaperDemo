(function ($) {
    $.PaperImage = function () {
        var context = $(document);
        var options = {};

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


        //#1 UPLOADING STEP
        var loadImage = function (imageData) {
            var setUserImage = function () {
                //Exif fixer(f.e. iOS mobile phone image rotated 90)
                var fixExif = function(imgToFix){
                    function rotateAndPaintImage(cnvContext, image, angle, positionX, positionY) {
                        var TO_RADIANS = Math.PI / 180;
                        cnvContext.save();
                        cnvContext.translate(positionX, positionY);
                        cnvContext.rotate(angle * TO_RADIANS);
                        cnvContext.drawImage(image, -image.width / 2, -(image.height / 2));
                        cnvContext.restore();
                    }

                    EXIF.getData(imgToFix, function () {
                        var imageOrientation = EXIF.getTag(this, 'Orientation');
                        //Rotation required
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
                                //Force loading event 2nd time with rotated image
                                loadImage($cnv[0].toDataURL('image/jpeg', 0.5));
                            }
                            img1.src = this.src;
                        } else {
                            //Cool! image rotated correctly
                            console.log('selected image loaded to <IMG>');
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

                if (userImage) {
                    userImage.remove();
                    userImage = null;
                }
                fixExif(this);
            };

            //Image loading failed
            var imageLoadError = function () {
                console.log('error loading image')
            };

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

        var initUploadStep = function () {
            imageReader.onload = function (e) {
                console.log('starting image upload')
                loadImage(e.target.result);
            };

            //Check file type
            var isImageFileType = function (file) {
                var typeMatch = file.type.match(/image\/(.*)/);
                return (typeMatch && ['png', 'gif', 'jpg', 'jpeg'].indexOf(typeMatch[1]) > -1);
            };

            //Read file as data url
            var loadImageFromDisk = function (file) {
                imageReader.readAsDataURL(file);
            };

            //Event: Select file from file system
            $('.js-load-from-disk input[type=file]').on('change', function () {
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


        //#2 Process thumbnails, render canvas
        var addImage = function (image, fillBg) {
            //drawing image with white BG(because image could be transparent)
            //required just for initial image or layer
            if (fillBg) {
                var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Point(image.width, image.height));
                var path = new paper.Path.Rectangle(rectangle);
                path.fillColor = '#fff';
            }
            var imageModel = new paper.Raster(image.src, 0, 0);
            return imageModel;
        };

        var bindEditPhotoModal = function () {
            $('.js-create-previews').on('click', function () {
                console.log('rendering image on canvas');
                //max XxY dimension restriction, f.e. iOS
                var maxSize = 5000000;
                mask2Active = false;

                var img = $('.js-crop-img')[0];
                var $canvas = $('.js-image-preview');

                //init paper with working canvas
                initPaper($canvas[0]);

                //Scaling canvas to image size
                $canvas.css('width', img.width);
                $canvas.css('height', img.height);

                //Add image to paper project(canvas)
                userImage = addImage(img, true);

                paper.view.size.setWidth(img.width);
                paper.view.size.setHeight(img.height);
                var canvasSize = img.width * img.height;
                //in case of large image scale it
                if (canvasSize > maxSize) {
                    paper.view.viewSize.setWidth(Math.floor(img.width * maxSize/ canvasSize));
                    paper.view.viewSize.setHeight(Math.floor(img.height * maxSize / canvasSize));
                } else {
                    //otherwise using image as is, or reduce canvas
                    paper.view.viewSize.setWidth(img.width);
                    paper.view.viewSize.setHeight(img.height);
                }

                //centering image
                paper.view.setCenter(img.width / 2, img.height / 2);
                userImage.position = paper.view.center;

                //duplicating image almost as is(iOS problem with index overflow)
                var cropedRaster = userImage.getSubRaster(new paper.Rectangle(coords.x, coords.y, coords.w - 5, coords.h - 5));
                userImage.remove();
                userImage = cropedRaster;

                //resizing and recenting croped image
                $canvas.css('width', coords.w);
                $canvas.css('height', coords.h);
                paper.view.size.width = coords.w;
                paper.view.size.height = coords.h;
                paper.view.viewSize.width = coords.w;
                paper.view.viewSize.height = coords.h;
                paper.view.setCenter(coords.w / 2, coords.h / 2);
                userImage.position = paper.view.center;
                cropedRaster.scale(1, 1);

                //Cool!, forcing update canvas
                paper.view.update();

                console.log('generating blured previews');
                var thumbCanvas = $('.js-image-thumb')[0].getContext('2d');
                var kk = cropedRaster.width / cropedRaster.height;
                var thumbW = 50;
                var thumbH = Math.round(thumbW / kk);

                //Callback for in-memory canvas converted to imaged(resized and a little bit cropped)
                var ss = new Image();
                ss.onload = function () {
                    console.log('Croped image converted to in-memory image and loaded');
                    ss.width = thumbW;
                    ss.height = thumbH;
                    //Drawing BIG preview image(converted from canvas) on small canvas with sizes equal to our previews
                    $('.js-image-thumb')[0].width = thumbW;
                    $('.js-image-thumb')[0].height = thumbH;
                    $('.js-image-thumb').css('width', thumbW);
                    $('.js-image-thumb').css('height', thumbH);
                    thumbCanvas.drawImage(ss, 0, 0, thumbW, thumbH);
                    console.log('Thumbnail blured preview canvas ready');
                    $('.js-blur').each(function () {
                        var deep = $(this).data('opacity');
                        var $thumb = $('.js-image-thumb');
                        var thumb = $thumb[0];
                        //Drawing original small preview
                        console.log('Drawing original small preview');
                        thumbCanvas.drawImage(ss, 0, 0, thumbW, thumbH);

                        if (deep != 0) {
                            //Bluring preview
                            console.log('Bluring preview');
                            thumbCanvas._blurRect(0, 0, thumbW, thumbH, thumbW, thumbH, deep);
                        }

                        //Converting to final preview
                        console.log('converting to final blurred preview');
                        $(this).attr('src', thumb.toDataURL('image/jpeg', 0.5));
                        $(this).css('height', thumbH + 'px');
                    });
                };

                //TODO: Dirty fix, raster with new image is not ready yet, see https://github.com/paperjs/paper.js/issues/924
                setTimeout(function () {
                    options.cropedSrc = $('.js-image-preview')[0].toDataURL('image/jpeg', 0.5);
                    options.cropedImage = new Image();
                    options.cropedImage.src = options.cropedSrc;
                    ss.src = options.cropedSrc;
                }, 1000);

                //We need to keep clena copy of original cropped image- performance reasons and f.e. wizard steps
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

                //switching to clean project
                paper.projects[1].activate();

                //copyig clean image to project #1
                paper.projects[0].activeLayer.children[0].copyTo(paper.projects[1]);
                paper.projects[0].activeLayer.children[1].copyTo(paper.projects[1]);
                paper.view.update();

                //going back to project #0
                paper.projects[0].activate();

                //Original image is large as a shit, but browser window is small, so we need work with small image, but save in future large "edited" image
                //Max window width is 500, so should be resized to maximum  = 500
                var $maxSize = 500;
                var origW = $canvas.width();
                var koef = coords.w / coords.h;
                var w = $maxSize;
                $canvas.css('width', w);
                $canvas.css('height', w / koef);
                options.koef = w / origW;
                paper.view.size = new paper.Size($canvas.width(), $canvas.height());
                paper.view.viewSize = new paper.Size($canvas.width(), $canvas.height());

                //Zooming(scaling)
                userImage.scale($canvas.width() / userImage.size.width, $canvas.height() / userImage.size.height);

                //Centering image in center of canvas
                paper.view.setCenter($canvas.width() / 2, $canvas.height() / 2);
                userImage.position = paper.view.center;

                //Cool! updating canvas
                paper.view.update();
            });
        };


        var setUserMask = function (maskImage) {

            //Rotate mask to default state
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

            //Rotate mask after scaling
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

            //Updating points position based on mask position
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
                //Just using another image for existing papep element
                activeMask.source = maskImage.src;
            } else {
                //Or adding new image to project
                var img = new Image();
                img.src = maskImage.src;
                activeMask = addImage(maskImage);

                activeMask.position = paper.view.center;
                activeMask.scale(1 / 2, 1 / 2);
                paper.view.update();
                var mask2 = mask2Active;
                //Event or draging mask
                activeMask.onMouseDrag = function (e) {
                    console.log('dragging');
                    this.position = e.point;
                    recalcPoints(mask2);
                };
                var circlePathLeft = getPoint(activeMask.position.x - activeMask.size.width / 2, activeMask.position.y);
                circlePathLeft.onMouseDrag = function (e) {
                    console.log('dragging LEFT point');
                    e.preventDefault();
                    e.stopPropagation();
                    var rotation = activeMask.matrix.rotation;
                    //rotate MASK
                    activeMask.rotate(-rotation, activeMask.position);
                    //rotate CURRENT POINT
                    e.point = e.point.rotate(-rotation, activeMask.position);
                    this.rotate(-rotation, activeMask.position);

                    //SCALE MASK
                    activeMask.scale(this.position.x / e.point.x, 1);

                    //ROTATE MASK BACK
                    this.rotate(rotation, activeMask.position);
                    activeMask.rotate(rotation, activeMask.position);
                    recalcPoints(mask2);
                }
                resPoints.push(circlePathLeft);
                var circlePathTop = getPoint(activeMask.position.x, activeMask.position.y - activeMask.size.height / 2);
                circlePathTop.onMouseDrag = function (e) {
                    console.log('dragging TOP point');
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
                    console.log('dragging RIGHT point');
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
                    console.log('dragging BOTTOM point');
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
                    console.log('dragging ROTATING point');
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

        var init2ndMaskStep = function () {
            $('.js-add-2nd-mask').on('click',  function () {
                $('.js-add-2nd-mask').addClass('hidden');
                $('.js-add-2nd-mask-select').removeClass('hidden');
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

        var bindBlurPhoto = function () {
            $('.js-blur').on('click', function () {
                //Remove from active project all elements except main image(f.e. masks, mask resize points)
                console.log('Removing all elements from paper project excet main image');
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

                //Get blur level, drawing image, blurring image
                var deep = $(this).data('opacity');
                options.blurDeep = deep;
                var img = options.cropedImage;
                var $canvas = $('.js-image-preview');
                var canvasContext = $canvas[0].getContext('2d');
                console.log('drawing image');
                canvasContext.drawImage(img, 0, 0, $canvas.width(), $canvas.height());
                if (deep != 0) {
                    console.log('bluring image');
                    canvasContext._blurRect(0, 0, $canvas.width(), $canvas.height(), $canvas.width(), $canvas.height(), deep);
                }
            });
        };

        var bindPreviewModal = function () {
            $('.js-convert-final').on('click', function () {
                var $canvas = $('.js-image-preview');
                var $canvasOrig = $('.js-image-orig');
                var mask;
                var sc;
                //Cleanup original project #1 - in case of wizard steps backward/forward
                console.log('clenup final paper project');
                var children = paper.projects[1].activeLayer.children;
                for (var j = children.length - 1; j > 1; j--) {
                    children[j].remove();
                }
                //Copying 1st mask to large project #1 and scaling masks to BIG size
                if (maskExist() && getUserMask()) {
                    console.log('mask #1 exists, using it');
                    mask = getUserMask().copyTo(paper.projects[1]);
                    sc = paper.projects[1].view.size.width / paper.projects[0].view.size.width;
                    mask.position.x *= sc;
                    mask.position.y *= sc;
                    mask.scale(sc);

                }
                //Same for 2nd mask
                if (mask2Exist() && getUserMask2()) {
                    console.log('mask #2 exists, using it too');
                    mask = getUserMask2().copyTo(paper.projects[1]);
                    sc = paper.projects[1].view.size.width / paper.projects[0].view.size.width;
                    mask.position.x *= sc;
                    mask.position.y *= sc;
                    mask.scale(sc);
                }
                //Updating view of project #1
                if (maskExist() || mask2Exist()) {
                    console.log('mask #1 or #2 exists, updating project');
                    paper.projects[1].activate();
                    paper.view.update();
                    paper.projects[0].activate();
                } else {
                    //For blur we don't need paper, so
                    //1. Drawing croped image
                    //2. Blurrring to selected blur level
                    console.log('blurrrrrring final image');
                    var canvasContextOrig = $canvasOrig[0].getContext('2d');
                    canvasContextOrig.drawImage(options.cropedImage, 0, 0, $canvasOrig.width(), $canvasOrig.height());
                    if (options.blurDeep != 0) {
                        canvasContextOrig._blurRect(0, 0, $canvasOrig.width(), $canvasOrig.height(), $canvasOrig.width(), $canvasOrig.height(), options.blurDeep * ($canvasOrig.width() / $canvas.width()));
                    }
                }
                //RESULT!
                console.log('result ready!');
                var imgData = $canvasOrig[0].toDataURL('image/jpeg', 0.5);
                $('.js-image-result').attr('src', imgData);
            });
        };




        var init = this.init = function (ctx, opts) {
            context = ctx || context;
            $.extend(options, opts);
            initUploadStep();
            bindEditPhotoModal();
            initMaskStep();
            init2ndMaskStep();
            bindBlurPhoto();
            bindPreviewModal();
        };
        return this;
    };
})(jQuery);