// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require('gulp');
// Importing all the Gulp-related packages we want to use
const sass = require('gulp-sass')(require('sass'));
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const replace = require('gulp-replace');
const browsersync = require('browser-sync').create();
const livereload = require('gulp-livereload');

// File paths
const files = {
	vendorScssPath: 'src/scss/vendor/vendor.scss',
	customScssPath: 'src/scss/custom/style.scss',
	vendorJsPath: 'src/js/vendor/*.js',
	customJsPath: 'src/js/custom/*.js',
};

// Sass task: compiles the style.scss file into style.css
function vendorScssTask() {
	return src(files.vendorScssPath, { sourcemaps: true }) // set source and turn on sourcemaps
		.pipe(sass()) // compile SCSS to CSS
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
		.pipe(dest('assets/css', { sourcemaps: '.' })); // put final CSS in dist folder with sourcemap
}

// Sass task: compiles the style.scss file into style.css
function customScssTask() {
	return src(files.customScssPath, { sourcemaps: true }) // set source and turn on sourcemaps
		.pipe(sass()) // compile SCSS to CSS
		.pipe(postcss([autoprefixer(), cssnano()])) // PostCSS plugins
		.pipe(dest('assets/css', { sourcemaps: '.' })); // put final CSS in dist folder with sourcemap
}

// JS task: concatenates and uglifies JS files to script.js
function vendorJsTask() {
	return src(
		[
			files.vendorJsPath,
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
		],
		{ sourcemaps: true }
	)
		.pipe(concat('vendor.js'))
		.pipe(terser())
		.pipe(dest('assets/js', { sourcemaps: '.' }));
}

// JS task: concatenates and uglifies JS files to script.js
function customJsTask() {
	return src(
		[
			files.customJsPath,
			//,'!' + 'includes/js/jquery.min.js', // to exclude any specific files
		],
		{ sourcemaps: true }
	)
		.pipe(concat('script.js'))
		.pipe(terser())
		.pipe(dest('assets/js', { sourcemaps: '.' }));
}


// Cachebust
// function cacheBustTask() {
// 	var cbString = new Date().getTime();
// 	return src(['index.html'])
// 		.pipe(replace(/cb=\d+/g, 'cb=' + cbString))
// 		.pipe(dest('.'));
// }

// Browsersync to spin up a local server
function browserSyncServe(cb) {
	// initializes browsersync server
	browsersync.init({
		server: {
			baseDir: './',
		},
		port: 3000,
		// notify: {
		// 	styles: {
		// 		top: 'auto',
		// 		bottom: '0',
		// 	},
		// },
	});
	// browsersync.init(null, {
	// 	proxy: "localhost/task-runner-with-gulp"
	// });
	cb();
}
function browserSyncReload(cb) {
	// reloads browsersync server
	browsersync.reload();
	cb();
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
	watch(
		[files.vendorScssPath, files.customScssPath, files.vendorJsPath, files.customJsPath],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(vendorScssTask, customScssTask, vendorJsTask, customJsTask))
	);
}

// Browsersync Watch task
// Watch HTML file for change and reload browsersync server
// watch SCSS and JS files for changes, run scss and js tasks simultaneously and update browsersync
function bsWatchTask() {
	watch('/*.html', browserSyncReload);
	watch(
		[files.vendorScssPath, files.customScssPath, files.vendorJsPath, files.customJsPath],
		{ interval: 1000, usePolling: true }, //Makes docker work
		series(parallel(vendorScssTask, customScssTask, vendorJsTask, customJsTask), browserSyncReload)
	);
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(parallel(vendorScssTask, customScssTask, vendorJsTask, customJsTask), watchTask);

// Runs all of the above but also spins up a local Browsersync server
// Run by typing in "gulp bs" on the command line
exports.bs = series(
	parallel(vendorScssTask, customScssTask, vendorJsTask, customJsTask),
	browserSyncServe,
	bsWatchTask
);
