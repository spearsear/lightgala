module.exports = function(grunt){
    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	concat: {
	    dist: {
		src: [
		    'public/js/main.js',
		    'public/js/controllers/*.js',
		    'public/js/services/*.js',
		    'public/js/directives/*.js',
		],
		dest: 'public/dist/js/lightgala.js',
	    }
	},
	uglify: {
	    build: {
		src: 'public/dist/js/lightgala.js',
		dest: 'public/dist/js/lightgala.min.js'
	    }
	},
	sass: {
	    dist: {
		options: {
		    style: 'compressed'
		},
		files: {
		    'public/dist/css/lightgala.min.css': 'public/css/*.scss'
		}
	    }
	},
	watch: {
	    options: {
		livereload: true,
	    },
	    scripts: {
		files: ['public/js/*.js','public/js/*/*.js'],
		tasks: ['concat','uglify'],
		options: {
		    spawn: false,
		}
	    },
	    css: {
		files: ['public/css/main.scss'],
		tasks: ['sass'],
		options: {
		    spawn: false,
		}
	    }
	}
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default',['concat','uglify']);
    grunt.registerTask('dev',['watch']);
}
