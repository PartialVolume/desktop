(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ("value" in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Neeto = Neeto || {};

angular.module('app.frontend', ['ui.router', 'ng-token-auth', 'restangular', 'ipCookie', 'oc.lazyLoad', 'angularLazyImg', 'ngDialog'])
// Configure path to API
.config(function (RestangularProvider, apiControllerProvider) {
  var url = apiControllerProvider.defaultServerURL();
  RestangularProvider.setBaseUrl(url);
  console.log(url);

  RestangularProvider.setFullRequestInterceptor(function (element, operation, route, url, headers, params, httpConfig) {
    var token = localStorage.getItem("jwt");
    if (token) {
      headers = _.extend(headers, { Authorization: "Bearer " + localStorage.getItem("jwt") });
    }

    return {
      element: element,
      params: params,
      headers: headers,
      httpConfig: httpConfig
    };
  });
});

// Shared function for configure auth service. Can be overwritten.
function configureAuth($authProvider, apiControllerProvider) {
  var url = apiControllerProvider.defaultServerURL();
  $authProvider.configure([{
    default: {
      apiUrl: url,
      passwordResetSuccessUrl: window.location.protocol + '//' + window.location.host + '/auth/reset'
    }
  }]);
}
;angular.module('app.frontend').config(function ($stateProvider, $urlRouterProvider, $locationProvider) {

  $stateProvider.state('base', {
    abstract: true
  })

  // Homepage
  .state('home', {
    url: '/',
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/home.html',
        controller: 'HomeCtrl'
      }
    }
  }).state('presentation', {
    url: '/:root_path',
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/presentation.html',
        controller: "PresentationCtrl"
      }
    },
    resolve: {
      presentation: getPresentation
    }
  }).state('group', {
    url: '/:root_path/:secondary_path',
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/presentation.html',
        controller: "PresentationCtrl"
      }
    },
    resolve: {
      presentation: getPresentation
    }
  })

  // Auth routes
  .state('auth', {
    abstract: true,
    url: '/auth',
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/auth/wrapper.html'
      }
    }
  }).state('auth.login', {
    url: '/login',
    templateUrl: 'frontend/auth/login.html'
  }).state('auth.forgot', {
    url: '/forgot',
    templateUrl: 'frontend/auth/forgot.html'
  }).state('auth.reset', {
    url: '/reset?reset_password_token&email',
    templateUrl: 'frontend/auth/reset.html',
    controller: function controller($rootScope, $stateParams) {
      $rootScope.resetData = { reset_password_token: $stateParams.reset_password_token, email: $stateParams.email };

      // Clear reset_password_token on change state
      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, options) {
        $rootScope.reset_password_token = null;
      });
    }
  })

  // 404 Error
  .state('404', {
    parent: 'base',
    views: {
      'content@': {
        templateUrl: 'frontend/errors/404.html'
      }
    }
  });

  function getPresentation($q, $state, $stateParams, Restangular) {
    var deferred = $q.defer();
    var restangularQuery = Restangular.one('presentations', 'show_by_path');
    restangularQuery.get({ root_path: $stateParams.root_path, secondary_path: $stateParams.secondary_path }).then(function (response) {
      deferred.resolve(response);
    }).catch(function (response) {
      $state.go('404');
    });

    return deferred.promise;
  }

  // Default fall back route
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var state = $injector.get('$state');
    state.go('404');
    return $location.path();
  });

  // enable HTML5 Mode for SEO
  $locationProvider.html5Mode(true);
});
;
var BaseCtrl = function BaseCtrl($rootScope, modelManager) {
  // $rootScope.resetPasswordSubmit = function() {
  //   var new_keys = Neeto.crypto.generateEncryptionKeysForUser($rootScope.resetData.password, $rootScope.resetData.email);
  //   var data = _.clone($rootScope.resetData);
  //   data.password = new_keys.pw;
  //   data.password_confirmation = new_keys.pw;
  //   $auth.updatePassword(data);
  //   apiController.setGk(new_keys.gk);
  // }

  // var note = new Note();
  // note.content = {title: "hello", text: "world"};
  // console.log("note content", note.content);
  // console.log("note title", note.title);
  // console.log("note json", JSON.stringify(note));
  //
  // console.log("Copy", _.cloneDeep(note));

  _classCallCheck(this, BaseCtrl);
};

angular.module('app.frontend').controller('BaseCtrl', BaseCtrl);
;angular.module('app.frontend').directive("editorSection", function ($timeout) {
  return {
    restrict: 'E',
    scope: {
      save: "&",
      remove: "&",
      note: "=",
      user: "="
    },
    templateUrl: 'frontend/editor.html',
    replace: true,
    controller: 'EditorCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {

      var handler = function handler(event) {
        if (event.ctrlKey || event.metaKey) {
          switch (String.fromCharCode(event.which).toLowerCase()) {
            case 's':
              event.preventDefault();
              $timeout(function () {
                ctrl.saveNote(event);
              });
              break;
            case 'e':
              event.preventDefault();
              $timeout(function () {
                ctrl.clickedEditNote();
              });
              break;
            case 'm':
              event.preventDefault();
              $timeout(function () {
                ctrl.toggleMarkdown();
              });
              break;
            case 'o':
              event.preventDefault();
              $timeout(function () {
                ctrl.toggleFullScreen();
              });
              break;
          }
        }
      };

      window.addEventListener('keydown', handler);

      scope.$on('$destroy', function () {
        window.removeEventListener('keydown', handler);
      });

      scope.$watch('ctrl.note', function (note, oldNote) {
        if (note) {
          ctrl.setNote(note, oldNote);
        } else {
          ctrl.note = {};
        }
      });
    }
  };
}).controller('EditorCtrl', function ($sce, $timeout, apiController, markdownRenderer, $rootScope) {

  this.demoNotes = [{ title: "Live print a file with tail", content: "tail -f log/production.log" }, { title: "Create SSH tunnel", content: "ssh -i .ssh/key.pem -N -L 3306:example.com:3306 ec2-user@example.com" }, { title: "List of processes running on port", content: "lsof -i:8080" }, { title: "Set ENV from file", content: "export $(cat .envfile | xargs)" }, { title: "Find process by name", content: "ps -ax | grep <application name>" }, { title: "NPM install without sudo", content: "sudo chown -R $(whoami) ~/.npm" }, { title: "Email validation regex", content: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$" }, { title: "Ruby generate 256 bit key", content: "Digest::SHA256.hexdigest(SecureRandom.random_bytes(32))" }, { title: "Mac add user to user group", content: "sudo dseditgroup -o edit -a USERNAME -t user GROUPNAME" }, { title: "Kill Mac OS System Apache", content: "sudo launchctl unload -w /System/Library/LaunchDaemons/org.apache.httpd.plist" }, { title: "Docker run with mount binding and port", content: "docker run -v /home/vagrant/www/app:/var/www/app -p 8080:80 -d kpi/s3" }, { title: "MySQL grant privileges", content: "GRANT [type of permission] ON [database name].[table name] TO ‘[username]’@'%’;" }, { title: "MySQL list users", content: "SELECT User FROM mysql.user;" }];

  this.showSampler = !this.user.id && this.user.filteredNotes().length == 0;

  this.demoNoteNames = _.map(this.demoNotes, function (note) {
    return note.title;
  });

  this.currentDemoContent = { text: null };

  this.prebeginFn = function () {
    this.currentDemoContent.text = null;
  }.bind(this);

  this.callback = function (index) {
    this.currentDemoContent.text = this.demoNotes[index].text;
  }.bind(this);

  this.contentCallback = function (index) {};

  this.setNote = function (note, oldNote) {
    this.editorMode = 'edit';
    if (note.content.text.length == 0) {
      this.focusTitle(100);
    }

    if (oldNote && oldNote != note) {
      if (oldNote.hasChanges) {
        this.save()(oldNote, null);
      } else if (oldNote.dummy) {
        this.remove()(oldNote);
      }
    }
  };

  this.onPreviewDoubleClick = function () {
    this.editorMode = 'edit';
    this.focusEditor(100);
  };

  this.focusEditor = function (delay) {
    setTimeout(function () {
      var element = document.getElementById("note-text-editor");
      element.focus();
    }, delay);
  };

  this.focusTitle = function (delay) {
    setTimeout(function () {
      document.getElementById("note-title-editor").focus();
    }, delay);
  };

  this.clickedTextArea = function () {
    this.showMenu = false;
  };

  this.renderedContent = function () {
    return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText(this.note.content.text));
  };

  var statusTimeout;

  this.saveNote = function ($event) {
    var note = this.note;
    note.dummy = false;
    this.save()(note, function (success) {
      if (success) {
        apiController.clearDraft();

        if (statusTimeout) $timeout.cancel(statusTimeout);
        statusTimeout = $timeout(function () {
          this.noteStatus = "All changes saved";
        }.bind(this), 200);
      }
    }.bind(this));
  };

  this.saveTitle = function ($event) {
    $event.target.blur();
    this.saveNote($event);
    this.focusEditor();
  };

  var saveTimeout;
  this.changesMade = function () {
    this.note.hasChanges = true;
    this.note.dummy = false;
    apiController.saveDraftToDisk(this.note);

    if (saveTimeout) $timeout.cancel(saveTimeout);
    if (statusTimeout) $timeout.cancel(statusTimeout);
    saveTimeout = $timeout(function () {
      this.noteStatus = "Saving...";
      this.saveNote();
    }.bind(this), 150);
  };

  this.contentChanged = function () {
    this.changesMade();
  };

  this.nameChanged = function () {
    this.changesMade();
  };

  this.onNameFocus = function () {
    this.editingName = true;
  };

  this.onContentFocus = function () {
    this.showSampler = false;
    $rootScope.$broadcast("editorFocused");
    this.editingUrl = false;
  };

  this.onNameBlur = function () {
    this.editingName = false;
  };

  this.toggleFullScreen = function () {
    this.fullscreen = !this.fullscreen;
    if (this.fullscreen) {
      if (this.editorMode == 'edit') {
        // refocus
        this.focusEditor(0);
      }
    } else {}
  };

  this.selectedMenuItem = function () {
    this.showMenu = false;
  };

  this.toggleMarkdown = function () {
    if (this.editorMode == 'preview') {
      this.editorMode = 'edit';
    } else {
      this.editorMode = 'preview';
    }
  };

  this.editUrlPressed = function () {
    this.showMenu = false;
    var url = this.publicUrlForNote(this.note);
    url = url.replace(this.note.presentation.root_path, "");
    this.url = { base: url, token: this.note.presentation.root_path };
    this.editingUrl = true;
  };

  this.saveUrl = function ($event) {
    $event.target.blur();

    var original = this.note.presentation.relative_path;
    this.note.presentation.relative_path = this.url.token;

    apiController.updatePresentation(this.note, this.note.presentation, function (response) {
      if (!response) {
        this.note.presentation.relative_path = original;
        this.url.token = original;
        alert("This URL is not available.");
      } else {
        this.editingUrl = false;
      }
    }.bind(this));
  };

  this.shareNote = function () {

    function openInNewTab(url) {
      var a = document.createElement("a");
      a.target = "_blank";
      a.href = url;
      a.click();
    }

    apiController.shareItem(this.user, this.note, function (note) {
      openInNewTab(this.publicUrlForNote(note));
    }.bind(this));
    this.showMenu = false;
  };

  this.unshareNote = function () {
    apiController.unshareItem(this.user, this.note, function (note) {});
    this.showMenu = false;
  };

  this.publicUrlForNote = function () {
    return this.note.presentationURL();
  };

  this.clickedMenu = function () {
    if (this.note.locked) {
      alert("This note has been shared without an account, and can therefore not be changed.");
    } else {
      this.showMenu = !this.showMenu;
    }
  };

  this.deleteNote = function () {
    apiController.clearDraft();
    this.remove()(this.note);
    this.showMenu = false;
  };

  this.clickedEditNote = function () {
    this.editorMode = 'edit';
    this.focusEditor(100);
  };
});
;angular.module('app.frontend').directive("groupsSection", function () {
  return {
    restrict: 'E',
    scope: {
      addNew: "&",
      selectionMade: "&",
      willSelect: "&",
      save: "&",
      groups: "=",
      allGroup: "=",
      user: "=",
      updateNoteGroup: "&"
    },
    templateUrl: 'frontend/groups.html',
    replace: true,
    controller: 'GroupsCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {
      scope.$watch('ctrl.groups', function (newGroups) {
        if (newGroups) {
          ctrl.setGroups(newGroups);
        }
      });
    }
  };
}).controller('GroupsCtrl', function () {

  var initialLoad = true;

  this.setGroups = function (groups) {
    if (initialLoad) {
      initialLoad = false;
      this.selectGroup(this.allGroup);
    } else {
      if (groups && groups.length > 0) {
        this.selectGroup(groups[0]);
      }
    }
  };

  this.selectGroup = function (group) {
    this.willSelect()(group);
    this.selectedGroup = group;
    this.selectionMade()(group);
  };

  this.clickedAddNewGroup = function () {
    if (this.editingGroup) {
      return;
    }

    this.newGroup = new Group({ notes: [] });
    if (!this.user.uuid) {
      this.newGroup.uuid = Neeto.crypto.generateRandomKey();
    }
    this.selectedGroup = this.newGroup;
    this.editingGroup = this.newGroup;
    this.addNew()(this.newGroup);
  };

  var originalGroupName = "";
  this.onGroupTitleFocus = function (group) {
    originalGroupName = group.name;
  };

  this.groupTitleDidChange = function (group) {
    this.editingGroup = group;
  };

  this.saveGroup = function ($event, group) {
    this.editingGroup = null;
    if (group.name.length == 0) {
      group.name = originalGroupName;
      originalGroupName = "";
      return;
    }

    $event.target.blur();
    if (!group.name || group.name.length == 0) {
      return;
    }

    this.save()(group, function (savedGroup) {
      _.merge(group, savedGroup);
      this.selectGroup(group);
      this.newGroup = null;
    }.bind(this));
  };

  this.noteCount = function (group) {
    var validNotes = Note.filterDummyNotes(group.notes);
    return validNotes.length;
  };

  this.handleDrop = function (e, newGroup, note) {
    this.updateNoteGroup()(note, newGroup, this.selectedGroup);
  }.bind(this);
});
;angular.module('app.frontend').directive("header", function () {
  return {
    restrict: 'E',
    scope: {
      user: "=",
      logout: "&"
    },
    templateUrl: 'frontend/header.html',
    replace: true,
    controller: 'HeaderCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {}
  };
}).controller('HeaderCtrl', function ($auth, $state, apiController, serverSideValidation, $timeout) {

  this.changePasswordPressed = function () {
    this.showNewPasswordForm = !this.showNewPasswordForm;
  };

  this.accountMenuPressed = function () {
    this.serverData = { url: apiController.getServer() };
    this.showAccountMenu = !this.showAccountMenu;
    this.showFaq = false;
    this.showNewPasswordForm = false;
  };

  this.changeServer = function () {
    apiController.setServer(this.serverData.url, true);
  };

  this.signOutPressed = function () {
    this.showAccountMenu = false;
    this.logout()();
    apiController.signout();
    window.location.reload();
  };

  this.submitPasswordChange = function () {
    this.passwordChangeData.status = "Generating New Keys...";

    $timeout(function () {
      if (data.password != data.password_confirmation) {
        alert("Your new password does not match its confirmation.");
        return;
      }

      apiController.changePassword(this.user, this.passwordChangeData.current_password, this.passwordChangeData.new_password, function (response) {});
    }.bind(this));
  };

  this.hasLocalData = function () {
    return this.user.filteredNotes().length > 0;
  };

  this.mergeLocalChanged = function () {
    if (!this.user.shouldMerge) {
      if (!confirm("Unchecking this option means any locally stored groups and notes you have now will be deleted. Are you sure you want to continue?")) {
        this.user.shouldMerge = true;
      }
    }
  };

  this.loginSubmitPressed = function () {
    this.loginData.status = "Generating Login Keys...";
    $timeout(function () {
      apiController.login(this.loginData.email, this.loginData.user_password, function (response) {
        if (response.errors) {
          this.loginData.status = response.errors[0];
        } else {
          this.onAuthSuccess(response.user);
        }
      }.bind(this));
    }.bind(this));
  };

  this.submitRegistrationForm = function () {
    this.loginData.status = "Generating Account Keys...";

    $timeout(function () {
      apiController.register(this.loginData.email, this.loginData.user_password, function (response) {
        if (response.errors) {
          this.loginData.status = response.errors[0];
        } else {
          this.onAuthSuccess(response.user);
        }
      }.bind(this));
    }.bind(this));
  };

  this.forgotPasswordSubmit = function () {
    $auth.requestPasswordReset(this.resetData).then(function (resp) {
      this.resetData.response = "Success";
      // handle success response
    }.bind(this)).catch(function (resp) {
      // handle error response
      this.resetData.response = "Error";
    }.bind(this));
  };

  this.encryptionStatusForNotes = function () {
    var allNotes = this.user.filteredNotes();
    var countEncrypted = 0;
    allNotes.forEach(function (note) {
      if (note.encryptionEnabled()) {
        countEncrypted++;
      }
    }.bind(this));

    return countEncrypted + "/" + allNotes.length + " notes encrypted";
  };

  this.downloadDataArchive = function () {
    var link = document.createElement('a');
    link.setAttribute('download', 'neeto.json');
    link.href = apiController.notesDataFile(this.user);
    link.click();
  };

  this.importFileSelected = function (files) {
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      apiController.importJSONData(e.target.result, function (success, response) {
        console.log("import response", success, response);
        if (success) {
          // window.location.reload();
        } else {
          alert("There was an error importing your data. Please try again.");
        }
      });
    };
    reader.readAsText(file);
  };

  this.onAuthSuccess = function (user) {
    this.user.id = user.id;

    if (this.user.shouldMerge && this.hasLocalData()) {
      apiController.mergeLocalDataRemotely(this.user, function () {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }

    this.showLogin = false;
    this.showRegistration = false;
  };
});
;angular.module('app.frontend').controller('HomeCtrl', function ($scope, $rootScope, $timeout, apiController, modelManager) {
  $rootScope.bodyClass = "app-body-class";
  $rootScope.title = "Notes — Neeto, a secure code box for developers";
  $rootScope.description = "A secure code box for developers to store common commands and useful notes.";

  var onUserSet = function onUserSet() {

    $scope.allGroup = new Group({ name: "All", all: true });
    $scope.groups = modelManager.groups;

    apiController.verifyEncryptionStatusOfAllItems($scope.defaultUser, function (success) {});
  };

  apiController.getCurrentUser(function (response) {
    if (response && !response.errors) {
      $scope.defaultUser = new User(response);
      modelManager.items = response.items;
      $rootScope.title = "Notes — Neeto";
      onUserSet();
    } else {
      $scope.defaultUser = new User(apiController.localUser());
      onUserSet();
    }
  });

  /*
  Groups Ctrl Callbacks
  */

  $scope.updateAllGroup = function () {
    $scope.allGroup.notes = modelManager.filteredNotes;
  };

  $scope.groupsWillMakeSelection = function (group) {
    if (group.all) {
      $scope.updateAllGroup();
    }
  };

  $scope.groupsSelectionMade = function (group) {
    if (!group.notes) {
      group.notes = [];
    }
    $scope.selectedGroup = group;
  };

  $scope.groupsAddNew = function (group) {
    modelManager.addTag(group);
  };

  $scope.groupsSave = function (group, callback) {
    apiController.saveItems([group], callback);
  };

  /*
  Called to update the group of a note after drag and drop change
  The note object is a copy of the original
  */
  $scope.groupsUpdateNoteGroup = function (noteCopy, newGroup, oldGroup) {

    var originalNote = _.find($scope.defaultUser.notes, { uuid: noteCopy.uuid });
    modelManager.removeTagFromNote(oldGroup, originalNote);
    if (!newGroup.all) {
      modelManager.addTagToNote(newGroup, originalNote);
    }

    apiController.saveDirtyItems(function () {});
  };

  /*
  Notes Ctrl Callbacks
  */

  $scope.notesRemoveGroup = function (group) {
    var validNotes = Note.filterDummyNotes(group.notes);
    if (validNotes == 0) {
      // if no more notes, delete group
      apiController.deleteItem($scope.defaultUser, group, function () {
        // force scope groups to update on sub directives
        $scope.groups = [];
        $timeout(function () {
          $scope.groups = modelManager.groups;
        });
      });
    } else {
      alert("To delete this group, remove all its notes first.");
    }
  };

  $scope.notesSelectionMade = function (note) {
    $scope.selectedNote = note;
  };

  $scope.notesAddNew = function (note) {
    if (!$scope.defaultUser.id) {
      // generate local id for note
      note.id = Neeto.crypto.generateRandomKey();
    }

    modelManager.addNote(note);

    if (!$scope.selectedGroup.all) {
      modelManager.addTagToNote($scope.selectedGroup, note);
    }
  };

  /*
  Shared Callbacks
  */

  $scope.saveNote = function (note, callback) {
    apiController.saveItems([note], function () {
      modelManager.addNote(note);
      note.hasChanges = false;

      if (callback) {
        callback(true);
      }
    });
  };

  $scope.deleteNote = function (note) {

    modelManager.deleteNote(note);

    if (note == $scope.selectedNote) {
      $scope.selectedNote = null;
    }

    if (note.dummy) {
      return;
    }

    apiController.deleteItem($scope.defaultUser, note, function (success) {});
    apiController.saveDirtyItems(function () {});
  };

  /*
  Header Ctrl Callbacks
  */

  $scope.headerLogout = function () {
    $scope.defaultUser = apiController.localUser();
    $scope.groups = $scope.defaultUser.groups;
  };
});
;angular.module('app.frontend').directive("notesSection", function () {
  return {
    scope: {
      addNew: "&",
      selectionMade: "&",
      remove: "&",
      group: "=",
      user: "=",
      removeGroup: "&"
    },
    templateUrl: 'frontend/notes.html',
    replace: true,
    controller: 'NotesCtrl',
    controllerAs: 'ctrl',
    bindToController: true,

    link: function link(scope, elem, attrs, ctrl) {
      scope.$watch('ctrl.group', function (group, oldGroup) {
        if (group) {
          ctrl.groupDidChange(group, oldGroup);
        }
      });
    }
  };
}).controller('NotesCtrl', function (apiController, $timeout, ngDialog, $rootScope) {

  $rootScope.$on("editorFocused", function () {
    this.showMenu = false;
  }.bind(this));

  var isFirstLoad = true;

  this.groupDidChange = function (group, oldGroup) {
    this.showMenu = false;

    if (this.selectedNote && this.selectedNote.dummy) {
      _.remove(oldGroup.notes, this.selectedNote);
    }

    this.noteFilter.text = "";
    this.setNotes(group.notes, false);

    if (isFirstLoad) {
      $timeout(function () {
        var draft = apiController.getDraft();
        if (draft) {
          var note = draft;
          this.selectNote(note);
        } else {
          this.createNewNote();
          isFirstLoad = false;
        }
      }.bind(this));
    } else if (group.notes.length == 0) {
      this.createNewNote();
    }
  };

  this.selectedGroupDelete = function () {
    this.showMenu = false;
    this.removeGroup()(this.group);
  };

  this.selectedGroupShare = function () {
    this.showMenu = false;

    if (!this.user.id) {
      alert("You must be signed in to share a group.");
      return;
    }

    if (this.group.all) {
      alert("You cannot share the 'All' group.");
      return;
    }

    var _callback = function (username) {
      apiController.shareItem(this.user, this.group, function (response) {});
    }.bind(this);

    if (!this.user.username) {
      ngDialog.open({
        template: 'frontend/modals/username.html',
        controller: 'UsernameModalCtrl',
        resolve: {
          user: function () {
            return this.user;
          }.bind(this),
          callback: function callback() {
            return _callback;
          }
        },
        className: 'ngdialog-theme-default',
        disableAnimation: true
      });
    } else {
      _callback(this.user.username);
    }
  };

  this.selectedGroupUnshare = function () {
    this.showMenu = false;
    apiController.unshareItem(this.user, this.group, function (response) {});
  };

  this.publicUrlForGroup = function () {
    return this.group.presentation.url;
  };

  this.setNotes = function (notes, createNew) {
    this.notes = notes;
    notes.forEach(function (note) {
      note.visible = true;
    });
    apiController.decryptNotesWithLocalKey(notes);
    this.selectFirstNote(createNew);
  };

  this.selectFirstNote = function (createNew) {
    var visibleNotes = this.notes.filter(function (note) {
      return note.visible;
    });

    if (visibleNotes.length > 0) {
      this.selectNote(visibleNotes[0]);
    } else if (createNew) {
      this.createNewNote();
    }
  };

  this.selectNote = function (note) {
    this.selectedNote = note;
    this.selectionMade()(note);
  };

  this.createNewNote = function () {
    var title = "New Note" + (this.notes ? " " + (this.notes.length + 1) : "");
    this.newNote = new Note({ dummy: true });
    this.newNote.content.title = title;
    modelManager.addTagToNote(this.group, this.newNote);
    this.selectNote(this.newNote);
    this.addNew()(this.newNote);
  };

  this.noteFilter = { text: '' };

  this.filterNotes = function (note) {
    if (this.noteFilter.text.length == 0) {
      note.visible = true;
    } else {
      note.visible = note.title.toLowerCase().includes(this.noteFilter.text) || note.text.toLowerCase().includes(this.noteFilter.text);
    }
    return note.visible;
  }.bind(this);

  this.filterTextChanged = function () {
    $timeout(function () {
      if (!this.selectedNote.visible) {
        this.selectFirstNote(false);
      }
    }.bind(this), 100);
  };
});
;angular.module('app.frontend').controller('UsernameModalCtrl', function ($scope, apiController, Restangular, user, callback, $timeout) {
  $scope.formData = {};

  $scope.saveUsername = function () {
    apiController.setUsername(user, $scope.formData.username, function (response) {
      var username = response.root_path;
      user.presentation = response;
      callback(username);
      $scope.closeThisDialog();
    });
  };
});
;
var Item = function () {
  function Item(json_obj) {
    _classCallCheck(this, Item);

    var content;

    Object.defineProperty(this, "content", {
      get: function get() {
        return content;
      },
      set: function set(value) {
        var finalValue = value;

        if (typeof value === 'string') {
          try {
            decodedValue = JSON.parse(value);
            finalValue = decodedValue;
          } catch (e) {
            finalValue = value;
          }
        }

        content = finalValue;
      },
      enumerable: true
    });

    _.merge(this, json_obj);

    this.setContentRaw = function (rawContent) {
      content = rawContent;
    };
  }

  _createClass(Item, [{
    key: 'referencesMatchingContentType',
    value: function referencesMatchingContentType(contentType) {
      return this.references.filter(function (reference) {
        return reference.content_type == content_type;
      });
    }
  }, {
    key: 'updateReferencesLocalMapping',
    value: function updateReferencesLocalMapping() {}
    // should be overriden to manage local properties


    /* Returns true if note is shared individually or via group */

  }, {
    key: 'isPublic',
    value: function isPublic() {
      return this.presentation;
    }
  }, {
    key: 'isEncrypted',
    value: function isEncrypted() {
      return this.encryptionEnabled() && typeof this.content === 'string' ? true : false;
    }
  }, {
    key: 'encryptionEnabled',
    value: function encryptionEnabled() {
      return this.loc_eek;
    }
  }, {
    key: 'presentationURL',
    value: function presentationURL() {
      return this.presentation.url;
    }
  }]);

  return Item;
}();

;
var Note = function (_Item) {
  _inherits(Note, _Item);

  function Note(json_obj) {
    _classCallCheck(this, Note);

    var _this = _possibleConstructorReturn(this, (Note.__proto__ || Object.getPrototypeOf(Note)).call(this, json_obj));

    if (!_this.content) {
      _this.content = { title: "", text: "" };
    }
    return _this;
  }

  _createClass(Note, [{
    key: 'filterDummyNotes',
    value: function filterDummyNotes(notes) {
      var filtered = notes.filter(function (note) {
        return note.dummy == false || note.dummy == null;
      });
      return filtered;
    }
  }, {
    key: 'isPublic',
    value: function isPublic() {
      return _get(Note.prototype.__proto__ || Object.getPrototypeOf(Note.prototype), 'isPublic', this).call(this) || this.hasOnePublicGroup;
    }
  }, {
    key: 'hasOnePublicGroup',
    get: function get() {
      var hasPublicGroup = false;
      this.groups.forEach(function (group) {
        if (group.isPublic()) {
          hasPublicGroup = true;
          return;
        }
      });

      return hasPublicGroup;
    }
  }, {
    key: 'content_type',
    get: function get() {
      return "Note";
    }
  }]);

  return Note;
}(Item);

;
var Tag = function (_Item2) {
  _inherits(Tag, _Item2);

  function Tag(json_obj) {
    _classCallCheck(this, Tag);

    return _possibleConstructorReturn(this, (Tag.__proto__ || Object.getPrototypeOf(Tag)).call(this, json_obj));
  }

  _createClass(Tag, [{
    key: 'content_type',
    get: function get() {
      return "Tag";
    }
  }]);

  return Tag;
}(Item);

;
var User = function User(json_obj) {
  _classCallCheck(this, User);

  _.merge(this, json_obj);
};

;angular.module('app.frontend').provider('apiController', function () {

  function domainName() {
    var domain_comps = location.hostname.split(".");
    var domain = domain_comps[domain_comps.length - 2] + "." + domain_comps[domain_comps.length - 1];
    return domain;
  }

  var url;

  this.defaultServerURL = function () {
    if (!url) {
      url = localStorage.getItem("server");
      if (!url) {
        url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port : '');
      }
    }
    return url;
  };

  this.$get = function (Restangular) {
    return new ApiController(Restangular);
  };

  function ApiController(Restangular) {

    /*
    Config
    */

    this.getServer = function () {
      if (!url) {
        url = localStorage.getItem("server");
        if (!url) {
          url = location.protocol + "//" + domainName() + (location.port ? ':' + location.port : '');
          this.setServer(url);
        }
      }
      return url;
    };

    this.setServer = function (url, refresh) {
      localStorage.setItem("server", url);
      if (refresh) {
        window.location.reload();
      }
    };

    /*
    Auth
    */

    this.getCurrentUser = function (callback) {
      if (!localStorage.getItem("jwt")) {
        callback(null);
        return;
      }
      Restangular.one("users/current").get().then(function (response) {
        callback(response.plain());
      });
    };

    this.login = function (email, password, callback) {
      var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
      this.setGk(keys.gk);
      var request = Restangular.one("auth/sign_in.json");
      request.user = { password: keys.pw, email: email };
      request.post().then(function (response) {
        localStorage.setItem("jwt", response.token);
        callback(response);
      });
    };

    this.register = function (email, password, callback) {
      var keys = Neeto.crypto.generateEncryptionKeysForUser(password, email);
      this.setGk(keys.gk);
      var request = Restangular.one("auth.json");
      request.user = { password: keys.pw, email: email };
      request.post().then(function (response) {
        localStorage.setItem("jwt", response.token);
        callback(response);
      });
    };

    this.changePassword = function (user, current_password, new_password) {
      var current_keys = Neeto.crypto.generateEncryptionKeysForUser(current_password, user.email);
      var new_keys = Neeto.crypto.generateEncryptionKeysForUser(new_password, user.email);

      var data = {};
      data.current_password = current_keys.pw;
      data.password = new_keys.pw;
      data.password_confirmation = new_keys.pw;

      var user = this.user;

      this._performPasswordChange(current_keys, new_keys, function (response) {
        if (response && !response.errors) {
          // this.showNewPasswordForm = false;
          // reencrypt data with new gk
          this.reencryptAllNotesAndSave(user, new_keys.gk, current_keys.gk, function (success) {
            if (success) {
              this.setGk(new_keys.gk);
              alert("Your password has been changed and your data re-encrypted.");
            } else {
              // rollback password
              this._performPasswordChange(new_keys, current_keys, function (response) {
                alert("There was an error changing your password. Your password has been rolled back.");
                window.location.reload();
              });
            }
          }.bind(this));
        } else {
          // this.showNewPasswordForm = false;
          alert("There was an error changing your password. Please try again.");
        }
      });
    };

    this._performPasswordChange = function (email, current_keys, new_keys, callback) {
      var request = Restangular.one("auth");
      request.user = { password: new_keys.pw, password_confirmation: new_keys.pw, current_password: current_keys.pw, email: email };
      request.patch().then(function (response) {
        callback(response);
      });
    };

    /*
    User
    */

    this.setUsername = function (user, username, callback) {
      var request = Restangular.one("users", user.id).one("set_username");
      request.username = username;
      request.post().then(function (response) {
        callback(response.plain());
      });
    };

    /*
    Ensures that if encryption is disabled, all local notes are uncrypted,
    and that if it's enabled, that all local notes are encrypted
    */
    this.verifyEncryptionStatusOfAllItems = function (user, callback) {
      var allNotes = user.filteredNotes();
      var notesNeedingUpdate = [];
      allNotes.forEach(function (note) {
        if (!note.isPublic()) {
          if (note.encryptionEnabled() && !note.isEncrypted()) {
            notesNeedingUpdate.push(note);
          }
        } else {
          if (note.isEncrypted()) {
            notesNeedingUpdate.push(note);
          }
        }
      }.bind(this));

      if (notesNeedingUpdate.length > 0) {
        console.log("verifying encryption, notes need updating", notesNeedingUpdate);
        this.saveBatchNotes(user, notesNeedingUpdate, callback);
      }
    };

    /*
    Items
    */

    this.saveDirtyItems = function (callback) {
      var dirtyItems = modelManager.dirtyItems;

      this.saveItems(dirtyItems, function (response) {
        modelManager.clearDirtyItems();
      });
    };

    this.saveItems = function (items, callback) {
      var request = Restangular.one("users", user.uuid).one("items");
      request.items = _.map(items, function (item) {
        return this.createRequestParamsFromItem(item, user);
      }.bind(this));

      request.post().then(function (response) {
        var savedItems = response.items;
        items.forEach(function (item) {
          _.merge(item, _.find(savedItems, { uuid: item.uuid }));
        });
        callback(response);
      });
    };

    this.createRequestParamsForItem = function (item, user) {
      var params = { uuid: item.uuid };

      if (!item.isPublic()) {
        // encrypted
        var itemCopy = _.cloneDeep(item);
        this.encryptSingleNote(itemCopy, this.retrieveGk());
        params.content = itemCopy.content;
        params.loc_eek = itemCopy.loc_eek;
      } else {
        // decrypted
        params.content = JSON.stringify(item.content);
        params.loc_eek = null;
      }
      return params;
    };

    this.deleteItem = function (user, item, callback) {
      if (!user.id) {
        this.writeUserToLocalStorage(user);
        callback(true);
      } else {
        Restangular.one("users", user.uuid).one("items", item.uuid).remove().then(function (response) {
          callback(true);
        });
      }
    };

    this.shareItem = function (user, item, callback) {
      if (!user.id) {
        alert("You must be signed in to share.");
      } else {
        Restangular.one("users", user.uuid).one("items", item.uuid).one("presentations").post().then(function (response) {
          var presentation = response.plain();
          _.merge(item, { presentation: presentation });
          callback(item);

          // decrypt references
          if (item.references.length > 0) {
            this.saveBatchItems(user, item.references, function (success) {});
          }
        });
      }
    };

    this.unshareItem = function (user, item, callback) {
      var request = Restangular.one("users", user.uuid).one("notes", item.uuid).one("presentations", item.presentation.uuid);
      request.remove().then(function (response) {
        item.presentation = null;
        callback(null);

        // encrypt references
        if (item.references.length > 0) {
          this.saveBatchItems(user, item.references, function (success) {});
        }
      });
    };

    /*
    Presentations
    */

    this.updatePresentation = function (resource, presentation, callback) {
      var request = Restangular.one("users", user.id).one("items", resource.id).one("presentations", resource.presentation.id);
      _.merge(request, presentation);
      request.patch().then(function (response) {
        callback(response.plain());
      }).catch(function (error) {
        callback(nil);
      });
    };

    /*
    Import
    */

    this.importJSONData = function (jsonString, callback) {
      var data = JSON.parse(jsonString);
      var user = new User(data);
      console.log("importing data", JSON.parse(jsonString));
      user.notes.forEach(function (note) {
        if (note.isPublic()) {
          note.setContentRaw(JSON.stringify(note.content));
        } else {
          this.encryptSingleNoteWithLocalKey(note);
        }

        // prevent circular links
        note.group = null;
      }.bind(this));

      user.groups.forEach(function (group) {
        // prevent circular links
        group.notes = null;
      });

      var request = Restangular.one("import");
      request.data = { notes: user.notes, groups: user.groups };
      request.post().then(function (response) {
        callback(true, response);
      }).catch(function (error) {
        callback(false, error);
      });
    };

    /*
    Export
    */

    this.notesDataFile = function (user) {
      var textFile = null;
      var makeTextFile = function (text) {
        var data = new Blob([text], { type: 'text/json' });

        // If we are replacing a previously generated file we need to
        // manually revoke the object URL to avoid memory leaks.
        if (textFile !== null) {
          window.URL.revokeObjectURL(textFile);
        }

        textFile = window.URL.createObjectURL(data);

        // returns a URL you can use as a href
        return textFile;
      }.bind(this);

      var presentationParams = function presentationParams(presentation) {
        if (!presentation) {
          return null;
        }

        return {
          id: presentation.id,
          uuid: presentation.uuid,
          root_path: presentation.root_path,
          relative_path: presentation.relative_path,
          presentable_type: presentation.presentable_type,
          presentable_id: presentation.presentable_id,
          created_at: presentation.created_at,
          modified_at: presentation.modified_at
        };
      };

      var notes = _.map(user.filteredNotes(), function (note) {
        return {
          id: note.id,
          uuid: note.uuid,
          content: note.content,
          group_id: note.group_id,
          created_at: note.created_at,
          modified_at: note.modified_at,
          presentation: presentationParams(note.presentation)
        };
      });

      var groups = _.map(user.groups, function (group) {
        return {
          id: group.id,
          uuid: group.uuid,
          name: group.name,
          created_at: group.created_at,
          modified_at: group.modified_at,
          presentation: presentationParams(group.presentation)
        };
      });

      var data = {
        notes: notes,
        groups: groups
      };

      return makeTextFile(JSON.stringify(data, null, 2 /* pretty print */));
    };

    /*
    Merging
    */
    this.mergeLocalDataRemotely = function (user, callback) {
      var request = Restangular.one("users", user.id).one("merge");
      var groups = user.groups;
      request.notes = user.notes;
      request.notes.forEach(function (note) {
        if (note.group_id) {
          var group = groups.filter(function (group) {
            return group.id == note.group_id;
          })[0];
          note.group_name = group.name;
        }
      });
      request.post().then(function (response) {
        callback();
        localStorage.removeItem('user');
      });
    };

    this.staticifyObject = function (object) {
      return JSON.parse(JSON.stringify(object));
    };

    this.writeUserToLocalStorage = function (user) {
      var saveUser = _.cloneDeep(user);
      saveUser.notes = Note.filterDummyNotes(saveUser.notes);
      saveUser.groups.forEach(function (group) {
        group.notes = null;
      }.bind(this));
      this.writeToLocalStorage('user', saveUser);
    };

    this.writeToLocalStorage = function (key, value) {
      localStorage.setItem(key, angular.toJson(value));
    };

    this.localUser = function () {
      var user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        user = { notes: [], groups: [] };
      }
      user.shouldMerge = true;
      return user;
    };

    /*
    Drafts
    */

    this.saveDraftToDisk = function (draft) {
      localStorage.setItem("draft", JSON.stringify(draft));
    };

    this.clearDraft = function () {
      localStorage.removeItem("draft");
    };

    this.getDraft = function () {
      var draftString = localStorage.getItem("draft");
      if (!draftString || draftString == 'undefined') {
        return null;
      }
      return new Note(JSON.parse(draftString));
    };

    /*
    Encrpytion
    */

    this.retrieveGk = function () {
      if (!this.gk) {
        this.gk = localStorage.getItem("gk");
      }
      return this.gk;
    };

    this.setGk = function (gk) {
      localStorage.setItem('gk', gk);
    };

    this.signout = function () {
      localStorage.removeItem("jwt");
      localStorage.removeItem("gk");
    };

    this.encryptSingleNote = function (note, key) {
      var ek = null;
      if (note.loc_eek) {
        ek = Neeto.crypto.decryptText(note.loc_eek, key);
      } else {
        ek = Neeto.crypto.generateRandomEncryptionKey();
        note.loc_eek = Neeto.crypto.encryptText(ek, key);
      }
      note.content = Neeto.crypto.encryptText(JSON.stringify(note.content), ek);
      note.local_encryption_scheme = "1.0";
    };

    this.encryptNotes = function (notes, key) {
      notes.forEach(function (note) {
        this.encryptSingleNote(note, key);
      }.bind(this));
    };

    this.encryptSingleNoteWithLocalKey = function (note) {
      this.encryptSingleNote(note, this.retrieveGk());
    };

    this.encryptNotesWithLocalKey = function (notes) {
      this.encryptNotes(notes, this.retrieveGk());
    };

    this.encryptNonPublicNotesWithLocalKey = function (notes) {
      var nonpublic = notes.filter(function (note) {
        return !note.isPublic() && !note.pending_share;
      });
      this.encryptNotes(nonpublic, this.retrieveGk());
    };

    this.decryptSingleNoteWithLocalKey = function (note) {
      this.decryptSingleNote(note, this.retrieveGk());
    };

    this.decryptSingleNote = function (note, key) {
      var ek = Neeto.crypto.decryptText(note.loc_eek || note.local_eek, key);
      var content = Neeto.crypto.decryptText(note.content, ek);
      //  console.log("decrypted contnet", content);
      note.content = content;
    };

    this.decryptNotes = function (notes, key) {
      notes.forEach(function (note) {
        //  console.log("is encrypted?", note);
        if (note.isEncrypted()) {
          this.decryptSingleNote(note, key);
        }
      }.bind(this));
    };

    this.decryptNotesWithLocalKey = function (notes) {
      this.decryptNotes(notes, this.retrieveGk());
    };

    this.reencryptAllNotesAndSave = function (user, newKey, oldKey, callback) {
      var notes = user.filteredNotes();
      notes.forEach(function (note) {
        if (note.isEncrypted()) {
          // first decrypt eek with old key
          var ek = Neeto.crypto.decryptText(note.loc_eek, oldKey);
          // now encrypt ek with new key
          note.loc_eek = Neeto.crypto.encryptText(ek, newKey);
        }
      });

      this.saveBatchNotes(user, notes, function (success) {
        callback(success);
      }.bind(this));
    };
  }
});
;

var ItemManager = function () {
  function ItemManager() {
    _classCallCheck(this, ItemManager);
  }

  _createClass(ItemManager, [{
    key: 'referencesForItemId',
    value: function referencesForItemId(itemId) {
      return _.find(this.items, { uuid: itemId });
    }
  }, {
    key: 'resolveReferences',
    value: function resolveReferences() {
      this.items.forEach(function (item) {
        // build out references
        _.map(item.references, function (reference) {
          return referencesForItemId(reference.uuid);
        });
      });
    }
  }, {
    key: 'itemsForContentType',
    value: function itemsForContentType(contentType) {
      this.items.filter(function (item) {
        return item.content_type == contentType;
      });
    }

    // returns dirty item references that need saving

  }, {
    key: 'deleteItem',
    value: function deleteItem(item) {
      _.remove(this.items, item);
      item.references.forEach(function (referencedItem) {
        removeReferencesBetweenItems(referencedItem, item);
      });

      return item.references;
    }
  }, {
    key: 'removeReferencesBetweenItems',
    value: function removeReferencesBetweenItems(itemOne, itemTwo) {
      _.remove(itemOne.references, _.find(itemOne.references, { uuid: itemTwo.uuid }));
      _.remove(itemTwo.references, _.find(itemTwo.references, { uuid: itemOne.uuid }));
      return [itemOne, itemTwo];
    }
  }, {
    key: 'createReferencesBetweenItems',
    value: function createReferencesBetweenItems(itemOne, itemTwo) {
      itemOne.references.push(itemTwo);
      itemTwo.references.push(itemOne);
      return [itemOne, itemTwo];
    }
  }, {
    key: 'items',
    set: function set(items) {
      this.items = items;
      resolveReferences();
    }
  }]);

  return ItemManager;
}();

angular.module('app.frontend').service('itemManager', ItemManager);
;angular.module('app.frontend').service('markdownRenderer', function ($sce) {

  marked.setOptions({
    breaks: true,
    sanitize: true
  });

  this.renderedContentForText = function (text) {
    if (!text || text.length == 0) {
      return "";
    }
    return marked(text);
  };

  this.renderHtml = function (html_code) {
    return $sce.trustAsHtml(html_code);
  };
});
;
var ModelManager = function (_ItemManager) {
  _inherits(ModelManager, _ItemManager);

  function ModelManager() {
    _classCallCheck(this, ModelManager);

    return _possibleConstructorReturn(this, (ModelManager.__proto__ || Object.getPrototypeOf(ModelManager)).apply(this, arguments));
  }

  _createClass(ModelManager, [{
    key: 'addDirtyItems',
    value: function addDirtyItems(items) {
      if (this.dirtyItems) {
        this.dirtyItems = [];
      }

      this.dirtyItems.concat(items);
    }
  }, {
    key: 'clearDirtyItems',
    value: function clearDirtyItems() {
      this.dirtyItems = [];
    }
  }, {
    key: 'addNote',
    value: function addNote(note) {
      if (!_.find(this.notes, { uuid: note.uuid })) {
        this.notes.unshift(note);
      }
    }
  }, {
    key: 'addTag',
    value: function addTag(tag) {
      this.tags.unshift(tag);
    }
  }, {
    key: 'addTagToNote',
    value: function addTagToNote(tag, note) {
      var dirty = this.createReferencesBetweenItems(tag, note);
      this.refreshRelationshipsForTag(tag);
      this.refreshRelationshipsForNote(note);
      this.addDirtyItems(dirty);
    }
  }, {
    key: 'refreshRelationshipsForTag',
    value: function refreshRelationshipsForTag(tag) {
      tag.notes = tag.referencesMatchingContentType("Note");
      tag.notes.sort(function (a, b) {
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
  }, {
    key: 'refreshRelationshipsForNote',
    value: function refreshRelationshipsForNote(note) {
      note.groups = note.referencesMatchingContentType("Group");
    }
  }, {
    key: 'removeTagFromNote',
    value: function removeTagFromNote(tag, note) {
      var dirty = this.removeReferencesBetweenItems(tag, note);
      this.addDirtyItems(dirty);
    }
  }, {
    key: 'deleteNote',
    value: function deleteNote(note) {
      var dirty = this.deleteItem(note);
      this.addDirtyItems(dirty);
    }
  }, {
    key: 'deleteTag',
    value: function deleteTag(tag) {
      var dirty = this.deleteItem(tag);
      this.addDirtyItems(dirty);
    }
  }, {
    key: 'filteredNotes',
    value: function filteredNotes() {
      return Note.filterDummyNotes(this.notes);
    }
  }, {
    key: 'items',
    set: function set(items) {
      _set(ModelManager.prototype.__proto__ || Object.getPrototypeOf(ModelManager.prototype), 'items', items, this);

      this.notes = _.map(this.items.itemsForContentType("Note"), function (json_obj) {
        return new Note(json_obj);
      });

      this.groups = _.map(this.items.itemsForContentType("Group"), function (json_obj) {
        var group = Group(json_obj);
        group.updateReferencesLocalMapping();
        return group;
      });
    }
  }, {
    key: 'dirtyItems',
    get: function get() {
      return this.dirtyItems || [];
    }
  }, {
    key: 'filteredNotes',
    get: function get() {
      return Note.filterDummyNotes(this.notes);
    }
  }]);

  return ModelManager;
}(ItemManager);

angular.module('app.frontend').service('modelManager', ModelManager);
;angular.module('app.frontend').service('serverSideValidation', function ($sce) {
  // Show validation errors in form.
  this.showErrors = function (formErrors, form) {
    angular.forEach(formErrors, function (errors, key) {
      if (typeof form[key] !== 'undefined') {
        form[key].$setDirty();
        form[key].$setValidity('server', false);
        form[key].$error.server = $sce.trustAsHtml(errors.join(', '));
      }
    });
  };

  // Get validation errors from server response and show them in form.
  this.parseErrors = function (response, form) {
    if (response.status === 422) {
      this.showErrors(response.data, form);
    }
  };
});
;angular.module('app.frontend').directive('mbAutofocus', ['$timeout', function ($timeout) {
  return {
    restrict: 'A',
    scope: {
      shouldFocus: "="
    },
    link: function link($scope, $element) {
      $timeout(function () {
        if ($scope.shouldFocus) {
          $element[0].focus();
        }
      });
    }
  };
}]);
;angular.module('app.frontend').directive('draggable', function () {
  return {
    scope: {
      note: "="
    },
    link: function link(scope, element) {
      // this gives us the native JS object
      var el = element[0];

      el.draggable = true;

      el.addEventListener('dragstart', function (e) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('Note', JSON.stringify(scope.note));
        this.classList.add('drag');
        return false;
      }, false);

      el.addEventListener('dragend', function (e) {
        this.classList.remove('drag');
        return false;
      }, false);
    }
  };
});

angular.module('app.frontend').directive('droppable', function () {
  return {
    scope: {
      drop: '&',
      bin: '=',
      group: "="
    },
    link: function link(scope, element) {
      // again we need the native object
      var el = element[0];

      el.addEventListener('dragover', function (e) {
        e.dataTransfer.dropEffect = 'move';
        // allows us to drop
        if (e.preventDefault) e.preventDefault();
        this.classList.add('over');
        return false;
      }, false);

      var counter = 0;

      el.addEventListener('dragenter', function (e) {
        counter++;
        this.classList.add('over');
        return false;
      }, false);

      el.addEventListener('dragleave', function (e) {
        counter--;
        if (counter === 0) {
          this.classList.remove('over');
        }
        return false;
      }, false);

      el.addEventListener('drop', function (e) {
        // Stops some browsers from redirecting.
        if (e.stopPropagation) e.stopPropagation();

        this.classList.remove('over');

        var binId = this.id;
        var note = new Note(JSON.parse(e.dataTransfer.getData('Note')));
        scope.$apply(function (scope) {
          var fn = scope.drop();
          if ('undefined' !== typeof fn) {
            fn(e, scope.group, note);
          }
        });

        return false;
      }, false);
    }
  };
});
;angular.module('app.frontend').directive('fileChange', function () {
  return {
    restrict: 'A',
    scope: {
      handler: '&'
    },
    link: function link(scope, element) {
      element.on('change', function (event) {
        scope.$apply(function () {
          scope.handler({ files: event.target.files });
        });
      });
    }
  };
});
;angular.module('app.frontend').directive('lowercase', function () {
  return {
    require: 'ngModel',
    link: function link(scope, element, attrs, modelCtrl) {
      var lowercase = function lowercase(inputValue) {
        if (inputValue == undefined) inputValue = '';
        var lowercased = inputValue.toLowerCase();
        if (lowercased !== inputValue) {
          modelCtrl.$setViewValue(lowercased);
          modelCtrl.$render();
        }
        return lowercased;
      };
      modelCtrl.$parsers.push(lowercase);
      lowercase(scope[attrs.ngModel]);
    }
  };
});
;angular.module('app.frontend').directive('selectOnClick', ['$window', function ($window) {
  return {
    restrict: 'A',
    link: function link(scope, element, attrs) {
      element.on('focus', function () {
        if (!$window.getSelection().toString()) {
          // Required for mobile Safari
          this.setSelectionRange(0, this.value.length);
        }
      });
    }
  };
}]);
;angular.module('app.frontend').directive('note', function ($timeout) {
  return {
    restrict: 'E',
    controller: 'SingleNoteCtrl',
    templateUrl: "frontend/directives/note.html",
    scope: {
      note: "="
    }
  };
}).controller('SingleNoteCtrl', function ($rootScope, $scope, $state, markdownRenderer) {
  $scope.renderedContent = function () {
    return markdownRenderer.renderHtml(markdownRenderer.renderedContentForText($scope.note.text));
  };
});
; /**
  * AngularJS directive that simulates the effect of typing on a text editor - with a blinking cursor.
  * This directive works as an attribute to any HTML element, and it changes the speed/delay of its animation.
  *
  * There's also a simple less file included for basic styling of the dialog, which can be overridden.
  * The config object also lets the user define custom CSS classes for the modal.
  *
  *  How to use:
  *
  *  Just add the desired text to the 'text' attribute of the element and the directive takes care of the rest.
  *  The 'text' attribute can be a single string or an array of string. In case an array is passed, the string
  *  on each index is erased so the next item can be printed. When the last index is reached, that string stays
  *  on the screen. (So if you want to erase the last string, just push an empty string to the end of the array)
  *
  * These are the optional preferences:
  *  - initial delay: set an 'initial-delay' attribute for the element
  *  - type delay: set a 'type-delay' attribute for the element
  *  - erase delay: set a 'erase-delay' attribute for the element
  *  - specify cursor : set a 'cursor' attribute for the element, specifying which cursor to use
  *  - turn off cursor blinking: set the 'blink-cursor' attribute  to "false"
  *  - cursor blinking speed: set a 'blink-delay' attribute for the element
  *  - scope callback: pass the desired scope callback as the 'callback-fn' attribute of the element
  *
  * Note:
  * Each time/delay value should be set either on seconds (1s) or milliseconds (1000)
  *
  * Dependencies:
  * The directive needs the css file provided in order to replicate the cursor blinking effect.
  */

angular.module('app.frontend').directive('typewrite', ['$timeout', function ($timeout) {
  function linkFunction($scope, $element, $attrs) {
    var timer = null,
        initialDelay = $attrs.initialDelay ? getTypeDelay($attrs.initialDelay) : 200,
        typeDelay = $attrs.typeDelay || 200,
        eraseDelay = $attrs.eraseDelay || typeDelay / 2,
        blinkDelay = $attrs.blinkDelay ? getAnimationDelay($attrs.blinkDelay) : false,
        cursor = $attrs.cursor || '|',
        blinkCursor = typeof $attrs.blinkCursor !== 'undefined' ? $attrs.blinkCursor === 'true' : true,
        currentText,
        textArray,
        running,
        auxStyle;

    if ($scope.text) {
      if ($scope.text instanceof Array) {
        textArray = $scope.text;
        currentText = textArray[0];
      } else {
        currentText = $scope.text;
      }
    }
    if (typeof $scope.start === 'undefined' || $scope.start) {
      typewrite();
    }

    function typewrite() {
      timer = $timeout(function () {
        updateIt($element, 0, 0, currentText);
      }, initialDelay);
    }

    function updateIt(element, charIndex, arrIndex, text) {
      if (charIndex <= text.length) {
        updateValue(element, text.substring(0, charIndex) + cursor);
        charIndex++;
        timer = $timeout(function () {
          updateIt(element, charIndex, arrIndex, text);
        }, typeDelay);
        return;
      } else {
        charIndex--;

        if ($scope.iterationCallback) {
          $scope.iterationCallback()(arrIndex);
        }

        // check if it's an array
        if (textArray && arrIndex < textArray.length - 1) {
          timer = $timeout(function () {
            cleanAndRestart(element, charIndex, arrIndex, textArray[arrIndex]);
          }, $scope.iterationDelay);
        } else {
          if ($scope.callbackFn) {
            $scope.callbackFn();
          }
          blinkIt(element, charIndex, currentText);
        }
      }
    }

    function blinkIt(element, charIndex) {
      var text = element.text().substring(0, element.text().length - 1);
      if (blinkCursor) {
        if (blinkDelay) {
          auxStyle = '-webkit-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-moz-animation:blink-it steps(1) ' + blinkDelay + ' infinite ' + '-ms-animation:blink-it steps(1) ' + blinkDelay + ' infinite;-o-animation:blink-it steps(1) ' + blinkDelay + ' infinite; ' + 'animation:blink-it steps(1) ' + blinkDelay + ' infinite;';
          updateValue(element, text.substring(0, charIndex) + '<span class="blink" style="' + auxStyle + '">' + cursor + '</span>');
        } else {
          updateValue(element, text.substring(0, charIndex) + '<span class="blink">' + cursor + '</span>');
        }
      } else {
        updateValue(element, text.substring(0, charIndex));
      }
    }

    function cleanAndRestart(element, charIndex, arrIndex, currentText) {
      if (charIndex == 0) {
        if ($scope.prebeginFn) {
          $scope.prebeginFn()();
        }
      }
      if (charIndex > 0) {
        currentText = currentText.slice(0, -1);
        // element.html(currentText.substring(0, currentText.length - 1) + cursor);
        updateValue(element, currentText + cursor);
        charIndex--;
        timer = $timeout(function () {
          cleanAndRestart(element, charIndex, arrIndex, currentText);
        }, eraseDelay);
        return;
      } else {
        arrIndex++;
        currentText = textArray[arrIndex];
        timer = $timeout(function () {
          updateIt(element, 0, arrIndex, currentText);
        }, typeDelay);
      }
    }

    function getTypeDelay(delay) {
      if (typeof delay === 'string') {
        return delay.charAt(delay.length - 1) === 's' ? parseInt(delay.substring(0, delay.length - 1), 10) * 1000 : +delay;
      } else {
        return false;
      }
    }

    function getAnimationDelay(delay) {
      if (typeof delay === 'string') {
        return delay.charAt(delay.length - 1) === 's' ? delay : parseInt(delay.substring(0, delay.length - 1), 10) / 1000;
      }
    }

    function updateValue(element, value) {
      if (element.prop('nodeName').toUpperCase() === 'INPUT') {
        return element.val(value);
      }
      return element.html(value);
    }

    $scope.$on('$destroy', function () {
      if (timer) {
        $timeout.cancel(timer);
      }
    });

    $scope.$watch('start', function (newVal) {
      if (!running && newVal) {
        running = !running;
        typewrite();
      }
    });

    $scope.$watch('text', function (newVal, oldVal) {
      if (!(newVal instanceof Array)) {
        currentText = newVal;
        typewrite();
      }
    });
  }

  return {
    restrict: 'A',
    link: linkFunction,
    replace: true,
    scope: {
      text: '=',
      callbackFn: '&',
      iterationCallback: '&',
      iterationDelay: '=',
      prebeginFn: '&',
      start: '='
    }
  };
}]);
;var Neeto = Neeto || {};

Neeto.crypto = {

  generateRandomKey: function generateRandomKey() {
    return CryptoJS.lib.WordArray.random(256 / 8).toString();
  },

  decryptText: function decryptText(encrypted_content, key) {
    return CryptoJS.AES.decrypt(encrypted_content, key).toString(CryptoJS.enc.Utf8);
  },

  encryptText: function encryptText(text, key) {
    return CryptoJS.AES.encrypt(text, key).toString();
  },

  generateRandomEncryptionKey: function generateRandomEncryptionKey() {
    var salt = Neeto.crypto.generateRandomKey();
    var passphrase = Neeto.crypto.generateRandomKey();
    return CryptoJS.PBKDF2(passphrase, salt, { keySize: 256 / 32 }).toString();
  },

  sha256: function sha256(text) {
    return CryptoJS.SHA256(text).toString();
  },

  /** Generates two deterministic 256 bit keys based on one input */
  generateAsymmetricKeyPair: function generateAsymmetricKeyPair(input, salt) {
    var output = CryptoJS.PBKDF2(input, salt, { keySize: 512 / 32, hasher: CryptoJS.algo.SHA512, iterations: 3000 });
    var firstHalf = _.clone(output);
    var secondHalf = _.clone(output);
    var sigBytes = output.sigBytes / 2;
    var outputLength = output.words.length;
    firstHalf.words = output.words.slice(0, outputLength / 2);
    secondHalf.words = output.words.slice(outputLength / 2, outputLength);
    firstHalf.sigBytes = sigBytes;
    secondHalf.sigBytes = sigBytes;
    return [firstHalf.toString(), secondHalf.toString()];
  },

  generateEncryptionKeysForUser: function generateEncryptionKeysForUser(password, email) {
    var keys = Neeto.crypto.generateAsymmetricKeyPair(password, email);
    var pw = keys[0];
    var gk = keys[1];

    return { pw: pw, gk: gk };
  }
};


},{}]},{},[1]);
