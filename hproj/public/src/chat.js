const socket = io('/home');
var userid = null;
var i = 1;
var socketroom1;


/* Khai báo module và controller angularjs cho toàn bộ container
   Có thể thêm controller và directive thích hợp */

var myApp = angular.module('myApp', ['ngRoute', 'ngMaterial', 'ui-notification', 'ngMessages']);
myApp.run(function($rootScope){
    $rootScope.roomsId = [];
    $rootScope.rooms = [];
    $rootScope.tempRoomId = 0;
    $rootScope.username = ' ';
    $rootScope.userid = 0;
    $rootScope.tempRoomName = '';
    $rootScope.loadedHistory = 0;
    $rootScope.reloadCount = 0;
    $rootScope.notifications = 0;
})
myApp
    .controller('myCtrl', function($scope, $http, $location, $rootScope, $routeParams, $route, Notification){

        /* Khi load trang thì lấy username, id */
        $scope.init = () =>{
            $http.get('/home/username').then((result) => {
                console.log(2);
                $rootScope.username = result.data.userdata.username;
                $rootScope.userid = result.data.userdata.userId;
                $rootScope.roomId = result.data.chatroom;
                $rootScope.roomId.forEach(element => {
                    socket.emit('join', element.chatroom_id);
                });
                for (let j = 0; j < result.data.chatroom.length; j++) {
                    $rootScope.rooms[j] = result.data.chatroom[j];
                    $rootScope.rooms[j].member = 0;
                    $rootScope.rooms[j].imageRoomSrc='/userAvatar/groupChat.jpg';
                    if($rootScope.tempRoomId == result.data.chatroom[j].chatroom_id && $routeParams.roomid) $rootScope.tempRoomName = $rootScope.rooms[j].chatroom_name;
                    if(result.data.chatroom[j].chatroom_name.indexOf('-')>-1){//là room của 2 bạn bè thì:
                        var nameRoom=result.data.chatroom[j].chatroom_name.split('-');
                        if($rootScope.userid===Number(nameRoom[0])){
                            nameRoom=nameRoom[1];
                        }
                        else if ($rootScope.userid===Number(nameRoom[1])){
                            nameRoom=nameRoom[0];
                        }
                        // $rootScope.rooms[j].friendId=frinedId;
                        $http({
                            method:'POST',
                            url:'idToname',
                            data:{user_id:nameRoom[0]}
                        }).then((data)=>{
                            console.log('sql:'+JSON.stringify(data.data));
                            $rootScope.rooms[j].chatroom_name=data.data[0].username;
                        });
                        $rootScope.rooms[j].imageRoomSrc='/userAvatar/'+nameRoom+'.jpg';
                    }
                    
                }
                $scope.loadNotifi();    
                $rootScope.$broadcast('username');
                $rootScope.$broadcast('loadRoom');
                //$rootScope.$broadcast('notifications');
            })
            $rootScope.loadedHistory = 0;

        }

        $scope.getHistory = (roomid) =>{
            $http.get('/home/messageHis/' + roomid).then((result) => {
                var imageUser='';
                var imageFriend='';
                var myUser;
                console.log(result);

                for(i = 0; i< result.data.length; i++){            //Kiểm tra result và thêm tin nhắn cũ
                    if(result.data[i].from_user === $rootScope.username){ 
                        imageUser='userAvatar/'+$rootScope.userid+'.jpg';
                        angular.element(".messagePend").append("<br><div class='currentUser'><div class='imageContainer'><img class='myImage' src="+imageUser+"></div><p class='myPa'>" + result.data[i].from_user +  ":" + result.data[i].content + "</p></div>"); 
                    } else{ 
                        imageFriend='userAvatar/'+result.data[i].user_id+'.jpg';
                        angular.element(".messagePend").append("<br><div class= 'friend'><div class='imageContainer' style='float:right;margin-right:100px'><img class='myImage' src="+imageFriend+"></div><p class='myPa' style='float:right'>" + result.data[i].from_user+":" + result.data[i].content + "</p></div>");
                    }
                }
                angular.element(".messagePend").append("<hr style='margin-bottom: 20px;'></hr>");
            })
            $rootScope.loadedHistory++;
            $(".messagePend").animate({ scrollTop: $(document).height() }, "slow");
        }


        $scope.loadNotifi = () =>{
            $http.get('/getNotifi/' + $rootScope.userid).then((result)=>{
                result.data.forEach(element =>{
                    $rootScope.notifications++;
                    $rootScope.$broadcast('notifications');
                    Notification(element.content);
                    // console.log(element.content);
                })
            })
        }
    
    
        /* Nhận tin nhắn */
        socket.on('message', (msg) => {
            console.log('msg: '+JSON.stringify(msg));// msg : {"roomid":"8","text":"dsaaaaa","username":"dsa","id":5,"roomname":"4-5"}
            var imageUser='';
            var imageFriend="";
            console.log('$rootScope.rooms: '+ JSON.stringify($rootScope.rooms));
            if(msg.roomid === $rootScope.tempRoomId){ 
                if(msg.username === $rootScope.username){
                    imageUser = 'userAvatar/'+msg.id+'.jpg';
                    angular.element(".messagePend").append("<br><div class='currentUser'><div class='imageContainer'><img class='myImage' src="+imageUser+" alt="+msg.username+"></div><p class='myPa'>" +" "+  msg.text + "</p></div>");
                } else {
                    imageFriend='userAvatar/'+msg.id+'.jpg';
                    angular.element(".messagePend").append("<br><div class= 'friend'><div class='imageContainer' style='float:right;margin-right:100px'><img class='myImage' src="+imageFriend+" alt="+msg.username+"></div><p class='myPa' style='float:right'>" +" " + msg.text + "</p></div>");    
                }
                $(".messagePend").animate({ scrollTop: $(document).height() }, "slow");  
            }
            else {
                $scope.loadNotifi();
                angular.element("#" + msg.roomid).addClass('red');
                sessionStorage.setItem("room" + msg.roomid, msg.roomid);
            }
        })
        socket.on('usernumber', (clients, roomid)=>{
            $rootScope.rooms.forEach(element => {
                if(element.chatroom_id === roomid) element.member = clients.length;       
            });
        })

        $rootScope.$on('reloadRoom', ()=>{
            $scope.init();
            console.log('reloaded');
        })

    })

    /**
     * Controller của content
     * 
     */

myApp
    .controller('contentController', function ($rootScope, $scope, $location, $http, $routeParams, $mdDialog, $window) {
        $scope.$on('ngRepeatFinished', function(ngRepeatFinishedEvent) {
            if(angular.element('.room-hover div')){
                for (let index = 0; index < $rootScope.rooms.length; index++) {
                    if(sessionStorage.getItem("room" + $rootScope.rooms[index].chatroom_id)){
                        angular.element("#" + $rootScope.rooms[index].chatroom_id).addClass('red');
                    }
                }
            }  
        });
        $scope.roomstest=$rootScope.rooms;
        for(var j=0;j<$rootScope.rooms.length;j++){
            $scope.roomstest[j].chatroom_id=$rootScope.rooms[j].chatroom_id;
            if($rootScope.rooms[j].chatroom_name.indexOf('-')){
                var nameRoom=$rootScope.rooms[j].chatroom_name.split('-');
                var friendId;
                if($rootScope.userid==nameRoom[0]) friendId=nameRoom[1];
                else friendId=nameRoom[0];
                $http({
                    method:'POST',
                    url:'/idToname',
                    data:{user_id:friendId}
                }).then(data=>{
                    // $scope.roomstest[j].chatroom_name=data.data[0].username;
                });
            }
        }
        $rootScope.$on('loadRoom', ()=>{
            $scope.roominit = ()=>{
                if($routeParams.roomid && $rootScope.loadedHistory ===0) {
                    console.log(1);
                    $rootScope.tempRoomId=$routeParams.roomid;
                    $rootScope.rooms.forEach(element => {
                        if(element.chatroom_id == $rootScope.tempRoomId) $rootScope.tempRoomName = element.chatroom_name;
                    });
                    $scope.getHistory($rootScope.tempRoomId);
                }
            }    
        })


        $rootScope.$on('menu-clicked', ()=>{
            $scope.myButton = !$scope.myButton;
        })

        $scope.selectedRow = null;
        $scope.panelClick = (index, room) => {
            $rootScope.loadedHistory = 0;
            angular.element('#'+room.chatroom_id).removeClass('red');
            $location.path('/chat/' + room.chatroom_id);
            $rootScope.tempRoomName = room.chatroom_name;
            if($scope.text) $scope.text.remove();
            $scope.selectedRow = index;
            sessionStorage.removeItem("room" + room.chatroom_id);
        }



        $scope.sendmessage = () =>{
            socket.emit('message', {roomid: $rootScope.tempRoomId, text: $scope.message, username: $rootScope.username, id: $rootScope.userid, roomname: $rootScope.tempRoomName});
            $scope.message = "";
            $("#messagePend").scrollTop = $("#messagePend").scrollHeight - $("#smessagePend").clientHeight;
        }

        $scope.deleteRoom = ()=>{
            $scope.showConfirm()
        }

        $scope.showConfirm = function(ev) {
            // Thêm dialog vào document để tránh thao tác với bên ngoài
            var confirm = $mdDialog.confirm()
                  .title('Xóa room')
                  .textContent('Bạn muốn xóa room chứ??')
                  .ariaLabel('Lucky day')
                  .targetEvent(ev)
                  .ok('Chắc chắn!')
                  .cancel('NOPE!');
        
            $mdDialog.show(confirm).then(function() {
                $http.post('/home/deleteRoom/' + $rootScope.tempRoomId).then((res)=>{
                    $window.location.href = '/home';
                })
            }, function() {
                $mdDialog.hide(confirm);
            });
          };


        $scope.inviteRoom = function(ev) {
            $mdDialog.show({
                controller: DialogInviteController,
                templateUrl: '/src/component/invite.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose:true,
                fullscreen: false 
                })
                .then(function(answer, roomname, roompass, roomdes) {
                if(answer === 'Cancel') {
                    $mdDialog.hide();
                }
                }, function() {
                });    
        }
          
        /**
         * Show form thêm room
         * 
         */

        $scope.showAdvanced = function(ev) {
            $mdDialog.show({
            controller: DialogAddController,
            templateUrl: '/src/component/testing.html',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose:true,
            fullscreen: false 
            })
            .then(function(answer, roomname, roompass, roomdes) {
            if(answer === 'Cancel') {
                $mdDialog.hide();
            }
            }, function() {
            });
        };



    })
    .directive('onFinishRender', function ($timeout) {  //Khi xong render thì emit repeat xong
        return {
          restrict: 'A',
          link: function (scope, element, attr) {
            if (scope.$last === true) {
              $timeout(function () {
                scope.$emit('ngRepeatFinished');
              });
            }
          }
        }
      })
    .directive('roomPanel', ()=>{ //Directive room-panel
        return {
            templateUrl: '/src/component/room.html',
        }
    })

/**
 * Config cho thông báo của ui-notification
 * 13/11/2019
 */


myApp.config(function(NotificationProvider) {
    NotificationProvider.setOptions({
        delay: 10000,
        startTop: 20,
        startRight: 10,
        verticalSpacing: 20,
        horizontalSpacing: 20,
        positionX: 'right',
        positionY: 'bottom'
    });
})

/**
 * Config cho route angularjs
 * 
 */


myApp.config(function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');
    $routeProvider
        .when('/', {
            template: '<room-panel></room-panel>',
            controller: 'contentController'
        })
        .when('/chat/:roomid', {
            templateUrl: '/src/component/chatroom.html',
            controller: 'contentController'
            })
        .when('/friends',{
            templateUrl:'/src/component/searchFriends.html',
            controller: menuCtrl
        })
        .when('/profile', {
            templateUrl: '/src/component/profile.html',
            controller: ProfileCtrl
        })
        .when('/admin', {
            templateUrl: '/src/component/admin.html',
            controller: AdminCtrl
        })
});
