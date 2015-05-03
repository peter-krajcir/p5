module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'src/js/script.js']
    },
    uglify: {
      build: {
        files: {
          'dist/js/script.js': ['src/js/script.js']
        }
      }
    },
    cssmin: {
      target: {
        files: [{
          'dist/css/style.css':['src/css/style.css']
        }]
      }
    },
    htmlmin: {
      dev: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'dist/index.html': 'src/index.html'
        }
      }
    }
  });

  // JS min
  grunt.loadNpmTasks('grunt-contrib-uglify');
  // CSS min
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  // HTML min
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  // JSHint
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task(s).
  grunt.registerTask('default', ['jshint','uglify','cssmin']);

};