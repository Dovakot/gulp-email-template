const gulp = require('gulp');
const plumber = require('gulp-plumber');
const sourcemap = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const server = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const del = require('del');
const pug = require('gulp-pug');
const cached = require('gulp-cached');
const gcmq = require('gulp-group-css-media-queries');
const inlineCss = require('gulp-inline-css');
const replace = require('gulp-replace');

const pugToHtml = () => {
  return gulp.src('source/pug/pages/*.pug')
    .pipe(plumber())
    .pipe(pug({ pretty: true }))
    .pipe(gulp.dest('build'));
};

const replaceTag = () => {
  return gulp.src('build/*.html')
    .pipe(replace('styleforstyletag', 'style'))
    .pipe(gulp.dest('temp/'));
};

const cssForStyle = (url) => {
  return gulp.src(url)
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass())
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
};

const cssForInline = () => cssForStyle('source/sass/styleForInline.scss');
const cssForStyleTag = () => cssForStyle('source/sass/styleForStyleTag.scss');

const inlineForSettings = (extraCss, isRemove) => ({
  extraCss: extraCss,
  applyStyleTags: true,
  applyLinkTags: false,
  removeStyleTags: isRemove,
  removeLinkTags: false,
  applyWidthAttributes: true,
  applyTableAttributes: false
})

const inlineForInline = () => {
  return gulp.src('build/*.html')
    .pipe(inlineCss(inlineForSettings('css/styleForInline.css', true)))
    .pipe(gulp.dest('build/'));
};

const inlineForStyleTag = () => {
  return gulp.src('build/*.html')
    .pipe(inlineCss(inlineForSettings('css/styleForStyleTag.css', false)))
    .pipe(gulp.dest('build/'));
};

const copyImages = () => {
  return gulp.src('source/img/**/*.{png,jpg}', {base: 'source'})
    .pipe(gulp.dest('build'));
};

const optimizeImages = () => {
  return gulp.src('build/img/**/*.{png,jpg}')
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
    ]))
    .pipe(gulp.dest('build/img'));
};

const copy = () => {
  return gulp.src([
    'source/fonts/**',
    'source/img/**',
  ], {
    base: 'source',
  })
    .pipe(gulp.dest('build'));
};

const copyHtml = () => {
  return gulp.src('temp/*.html')
    .pipe(gulp.dest('build'));
};

const clean = () => {
  return del('build');
};

const syncServer = () => {
  server.init({
    server: 'build/',
    notify: false,
    open: true,
    cors: true,
    ui: false,
  });

  gulp.watch('source/pug/**/*.pug', gulp.series(cssForInline, cssForStyleTag, pugToHtml, inlineForInline, inlineForStyleTag, replaceTag, copyHtml, refresh));
  gulp.watch('source/sass/**/*.{scss,sass}', gulp.series(cssForInline, cssForStyleTag, pugToHtml, inlineForInline, inlineForStyleTag, replaceTag, copyHtml, refresh));
  gulp.watch('source/img/**/*.{png,jpg}', gulp.series(copyImages, pugToHtml, refresh));
};

const refresh = (done) => {
  server.reload();
  done();
};

const start = gulp.series(clean, copy, cssForInline, cssForStyleTag, pugToHtml, inlineForInline, inlineForStyleTag, replaceTag, copyHtml, syncServer);
const build = gulp.series(clean, copy, cssForInline, cssForStyleTag, pugToHtml, inlineForInline, inlineForStyleTag, replaceTag, copyHtml, optimizeImages);

exports.imagemin = optimizeImages;
exports.start = start;
exports.build = build;
