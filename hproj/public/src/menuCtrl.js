function menuCtrl($rootScope, $scope, $location, $http, $window){

    $scope.listFriends=[];
    $scope.listInvitation=[];

    $rootScope.$on('menu-clicked', ()=>{
        $scope.myButton = !$scope.myButton;
    })
    $scope.menuClicked=index=>{
        if(index == 0){
            $location.path('/');
        }
        if(index == 1){
            $location.path('/profile');
        }
        if(index==2){    
            $location.path('/friends');
        }
        if(index==3){    
            $location.path('/admin');
        }
        else if(index==4){
            $http({
                method:'GET',
                url:'/logout',
            }).then((res)=>{
                $window.location.href = '/'
            });
        }
    }
    $scope.showEl=element=>{
        if($scope.listFriends.length>0) $location.path('/chat/'+element.chatroom_id);
        console.log('Click Li');
    }
    $scope.display=()=>{
        $location.path('/friends');
        $http({
            method:'POST',
            url:'/addFriends',
            data:{username:$scope.asd}
        }).then(res=>{
            $window.alert(res.data);
        });
    }

    $scope.addFriendBut=friend=>{
        $http({
            method:'POST',
            url:'/getListInvitation',
            data:{userSend:friend.user_id}
        }).then(res=>{
            console.log('sdfsdkl;gjlsd    '+res);
        });
        $window.location.reload();
        
    }

    $scope.removeInvi = friend=>{
        $http({
            method:'POST',
            url:'/removeInvi',
            data:{userSend:friend.user_id}
        });
        $window.location.reload();   
    }

    var renderListFriends=()=>{
        $http({
                method:'GET',
                url:'/addFriends',
            }).then(res=>{//res.data chuua res.data[i].chatroom_id
                if(res.data) $scope.listFriends=res.data;
            });
    }
    renderListFriends();
    var renderListInvitation=()=>{
        $http({
            method:'GET',
            url:'/getListInvitation'
        }).then(res=>{
            if(res.data) $scope.listInvitation=res.data;
            res.send('ok');
        });
    }
    renderListInvitation();

    $scope.unfriend=x=>{
        $http({
            method:'POST',
            url:'/unfriend',
            data:{friend:x}
        }).then(res=>{
            res.send('ok');
        });
        $location.path('/friends'); 
        $window.location.reload();
    }

}


angular.module('myApp').component('menu', {
    templateUrl: '/src/component/menu.html',
    controller: menuCtrl
  });