var gulp = require('gulp');
var plugins = require('gulp-load-plugins')({
    rename: {}
});
plugins.path = require('path');
plugins.autoprefix = new (require('less-plugin-autoprefix'))({ browsers: ["last 2 versions"] });

var gulp = require('gulp');
plugins.browserSync = require('browser-sync').create();

gulp.task('build-less', function () {
    return gulp.src('src/main.less')
        //.pipe(plugins.sourcemaps.init())
        .pipe(plugins.less({ relativeUrls: true}))
        //.pipe(plugins.sourcemaps.write('.', { includeContent: false }))
        .pipe(gulp.dest('dist'));
});

gulp.task('build-js', function () {
    return gulp.src([
            'bower_components/jquery/dist/jquery.js',
            'bower_components/bootstrap-less/js/transition.js',
            'bower_components/bootstrap-less/js/alert.js',
            'bower_components/bootstrap-less/js/button.js',
            'bower_components/bootstrap-less/js/carousel.js',
            'bower_components/bootstrap-less/js/collapse.js',
            'bower_components/bootstrap-less/js/dropdown.js',
            'bower_components/bootstrap-less/js/modal.js',
            'bower_components/bootstrap-less/js/tooltip.js',
            'bower_components/bootstrap-less/js/popover.js',
            'bower_components/bootstrap-less/js/scrollspy.js',
            'bower_components/bootstrap-less/js/tab.js',
            'bower_components/bootstrap-less/js/affix.js',
            'bower_components/exif-js/exif.js',
            'bower_components/paper/dist/paper-full.js',
            'src/canvas_blur_rect.js',
            'src/image-editor.js',
            'src/main.js'])
        //.pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('scripts.js'))
        //.pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest('dist'));
});


gulp.task('watcher', function () {
    plugins.browserSync.init({
        server:{
            baseDir:'./'
        },
        files: [
            'index.html',
            'dist/scripts.js',
            'dist/main.css']
    });
    gulp.watch('src/main.less', ['build-less']);
    gulp.watch(['src/image-editor.js', 'src/main.js'], ['build-js']);
});