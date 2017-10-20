import gulp from 'gulp';
import rename from 'gulp-rename';
// import addsrc from 'gulp-add-src';
import concat from 'gulp-concat';
import header from 'gulp-header';
import sass from 'gulp-sass';
import cleanCSS from 'gulp-clean-css';
import bump from 'gulp-bump';
import eslint from 'gulp-eslint';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import uglify from 'gulp-uglify';
import browserSync from 'browser-sync';
import pug from 'gulp-pug-i18n';
import jsonTransform from 'gulp-json-transform';

const pkg = require('./package.json');

function getBanner() {
  return ['/**',
    ' * ${pkg.name}', // eslint-disable-line no-template-curly-in-string
    ' * @version v${pkg.version} - ' + new Date().toISOString(), // eslint-disable-line no-template-curly-in-string,  prefer-template
    ' */',
    ''].join('\n');
} // getBanner

gulp.task('lint', () => {
  gulp.src([
    'gulpfile.babel.js',
    'src/**/*.js',
  ])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('scripts', ['lint'], () =>
  browserify('src/root.jsx', {
    extensions: ['.js', '.jsx'],
  })
    .transform(babelify)
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    // .pipe(addsrc.prepend([
    //   'node_modules/promise-polyfill/promise.js',
    // ]))
    // .pipe(concat('app.js'))
    .pipe(header(getBanner(), { pkg }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(getBanner(), { pkg }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist')));

gulp.task('styles', () =>
  gulp.src('./src/styles/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('app.css'))
    .pipe(header(getBanner(), { pkg }))
    .pipe(gulp.dest('dist'))
    .pipe(cleanCSS())
    .pipe(header(getBanner(), { pkg }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist')));

gulp.task('views', () => {
  gulp.src('src/index.pug')
    .pipe(rename({ basename: 'debug' }))
    .pipe(pug({
      i18n: {
        locales: 'src/i18n/*.json',
        filename: '{{lang}}/{{basename}}.html',
      },
      pretty: true,
      data: {
        debug: true,
      },
    }))
    .pipe(gulp.dest('dist'));

  return gulp.src('src/index.pug')
    .pipe(pug({
      i18n: {
        namespace: null,
        locales: 'src/i18n/*.json',
        filename: '{{lang}}/{{basename}}.html',
      },
      data: {
        debug: false,
      },
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('i18n', () =>
  gulp.src('src/i18n/*.json')
    // .pipe(jsonTransform(data => `globals.i18n = ${JSON.stringify(data, null, 2)};`)) // debug
    .pipe(jsonTransform(data => `globals.i18n = ${JSON.stringify(data)};`))
    .pipe(rename((path) => {
      path.dirname = path.basename; // eslint-disable-line  no-param-reassign
      path.basename = 'locale'; // eslint-disable-line  no-param-reassign
      path.extname = '.js'; // eslint-disable-line  no-param-reassign
    }))
    .pipe(gulp.dest('dist')));

gulp.task('bump', () =>
  gulp.src('./package.json')
    .pipe(bump({ type: 'patch' }))
    .pipe(gulp.dest('./')));

gulp.task('dist', ['scripts', 'styles', 'views', 'i18n']);
gulp.task('default', ['dist']);

gulp.task('serve', ['dist'], () => {
  browserSync({
    server: {
      baseDir: './',
      directory: true,
    },
    port: 4000,
    startPath: '/dist/we/debug.html',
  });

  gulp.watch('src/index.pug', ['views']);
  gulp.watch(['src/**/*.js', 'src/**/*.jsx'], ['scripts']);
  gulp.watch('src/i18n/*.json', ['i18n']);
  gulp.watch('src/styles/*.scss', ['styles']);

  gulp.watch([
    'dist/**',
  ])
    .on('change', browserSync.reload);
});
