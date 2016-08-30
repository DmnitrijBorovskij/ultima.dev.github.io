'use strict'
$(function(){

	if (!UF) var UF = {};

    UF.audio = $('#audio');
    UF.audio_current_time = $('.player-progress .pp-text-left');
    UF.event_type = 'click';
    UF.player_button = $('.player-btn');
    UF.player_progress = $('.header .player-progress');

	UF.player = {
		el: $('.player')[0],
		el_play:  $('#audio')[0],
		el_author:  $('.player-track-artist')[0],
		el_song:  $('.player-track-title')[0],
		state: 'pause',
        setVolume: function() {
            $(UF.player.el_play).prop("volume", "0.5");   
        },
		updateMeta: function() {
		//192.168.21.9:8001
		$.get("http://sc.ultima.fm:8001/currentsong?sid=1",
			function (data) {
				data = data || '';
				var meta =  data.split('-');
				$(UF.player.el_author).html(meta[0]);
				$(UF.player.el_song).html(meta[1]);
				console.log(data);
			});
		}
	}
    
    UF.player_button.on(UF.event_type, playStopPlayer);
	UF.player.updateMeta();
    UF.player.setVolume();
    protectEmail();
    
	setInterval(function(){
		UF.player.updateMeta();
	}, 5000);

	$('.live').on(UF.event_type, function() {
		$('.player').toggleClass('broadcasting');
	});


	var view;

	var startIndexPost = 5;
	var countPosts = 5;

		$(".blog-wrapper").mCustomScrollbar({
    	axis:"y",
    	theme:"my-theme",
    		callbacks:{
		        onTotalScroll:function(){
		   //      	if (window.matchMedia("(min-width: 768px)").matches) {
			  //       	$.ajax({
					//    		type: 'POST',
					//      	url: 'wp-content/themes/ultima/showposts.php',
					//      	dataType: "json",
					//      	data: { 
					//      		"countPosts" : countPosts,
					//      		"startIndexPost" : startIndexPost
					//      	},
					//      	success: function(data){
					// 			view = data;
	    //    						view.convertUnixtime = function () {
					// 				return function (timestamp, render) {
					//    					return convertUnixtime(timestamp, render);	
					//    				}
	   	// 						}
	    //    						//console.log(view);
					// 			getTemplate('wp-content/themes/ultima/templates/template.html');
					    
					// 			//console.log(startIndexPost);
					// 			startIndexPost += 5;
					// 		}
					// 	})
					// }
		        }
	    	}
		});


	$(".archive-wrapper").mCustomScrollbar({
    	axis:"y",
    	theme:"my-theme",
	});

	var date_last_post;
	$.ajax({	
    	type: 'GET',
     	url: 'wp-content/themes/ultima/select.php',
     	dataType: "json",
     	success: function (resp) {

     		view = resp;
       		view.convertUnixtime = function () {
				return function (timestamp, render) {
   					return convertUnixtime(timestamp, render);	
   				}
   			}
       		console.log(view);
       		date_last_post = view[0].created_at;
       		// console.log(date_last_post);
			// setTimeout(sleep_btn_show_more, 100);
			getTemplate('wp-content/themes/ultima/templates/template.html');	
     	}
	})

	$('.audio').on(UF.event_type, function() {
		if (!$('.player-archive').length) {
			$('header').toggleClass('player-archive player-live');
		}
		$('.live').addClass('live-show');
	});


	$('.archive-audio').on(UF.event_type, function() {
		$('.archive-audio').removeClass('archive-audio-playing');
		$(this).addClass('archive-audio-playing');
	})

	function search_new_post () {
		setInterval(function () {
			$.ajax({	
	    		type: 'POST',
	     		url: 'wp-content/themes/ultima/search_new_post.php',
	     		dataType: "json",
	     		data: {"date_last_post" : date_last_post},
	     		success: function (resp) {

		     		view = resp;
		       		if (view.length != 0) {
		       			console.log(view);
		       			//$('.post:first').before("<div class='post'><li class='item'>Тест3</li></div>");
		       			date_last_post = view[0].created_at;
		       			view.convertUnixtime = function () {
							return function (timestamp, render) {
		   						return convertUnixtime(timestamp, render);	
		   					}
		   				}
		       			//console.log(date_last_post);
						getTemplate('wp-content/themes/ultima/templates/template.html');	
					}
	     		}
			})
		}, 10000);
	}

	function search() {
		var search_val = $(".form-search").find(".fs-input").val();
		$.post('/wp-admin/admin-ajax.php', 	{ 'action' : 'my_action', 'search_val' : search_val }, function(data){
			data = data.slice(0, -1);
			$("#mCSB_1_container").children().not('.current').remove();
			$('.current').css('display', 'none');
			$("#mCSB_1_container").append(data);
			initRecordArchive();
			$('.record-archive:eq(1)').css('margin-top', '55px');
		});	
	}	

	$('.form-search').keyup(function(){
		search_val = $(".form-search").find(".fs-input").val();
		console.log(search_val);
  		search();
	});

	var cur_song, prev_song;
	

	$(".blog").on(UF.event_type, ".play-btn", function() {
  		$(this).toggleClass('stop');
	});

	var timer;
	function togglePlayPause(audio) {
		// var currentBtn = obj,
		//     currentRecord = $(obj).find('audio');
			
		//currentRecord.siblings('.progress').css('display', 'block');
		// currentRecord.on('ended', function() {
		// 	$(currentBtn).children('.play-pause-button').removeClass("pause");
		// })

	   	// $('.record-control').not(currentBtn).each(function() {
	   	// 	$(this).children('.play-pause-button').removeClass("pause");
	   	// 	$(this).siblings('.record').children(".progress").css('display', 'none');
	   	// });

	   	if (audio.prop("paused")) {
	   		$('.player-btn').addClass('player-btn-pause');
	   		audio.trigger('load');
	   		audio.trigger('play');
	   		// $('.duration-record').not(currentRecord.siblings('.duration-record')).each(function() {
	   		// 	var d = ($(this).siblings('audio').prop("duration"));		
	   		// 	$(this).html(timeFormat(d.toFixed()*1000));	
	   		// })
	   		
	   		//останавливаем все песни кроме текущей
	  //  		$("audio").not(currentRecord).each(function() {
	  //  			$(this).trigger('pause');
	  //  			$(this).prop('currentTime', 0);
	  //  		})

	  //  		if (!cur_song) {
			// 	cur_song = currentRecord;
			// 	console.log('cur_song', cur_song);
			// } else {
			// 	prev_song = $(cur_song).closest('.record-archive');
			// 	cur_song = currentRecord;
			// 	prev_song.removeClass('current');
			// }

	  //  		// убираем продложительность всех песен кроме текущей
			// $(".progress-val").not(currentRecord.children('progress').children('progress-val')).each(function() {
	  //  			$(this).width(0 + '%');
	  //  		})
			clearInterval(timer);
	   	}
	   	else {	
	   		$('.player-btn').removeClass("player-btn-pause");
	   		audio.trigger('pause');
	    }
  	}

	function initRecordArchive() {
    	var allRecordsArchive = $('.record-archive').find('audio');
    	$(allRecordsArchive).each(function () {
      		if ($(this).prop("readyState") < 1) {
    			$(this).on("loadedmetadata", function () {
    				$(this).siblings('.duration-record').html(timeFormat($(this).prop("duration").toFixed()*1000));
    			});
			}
			else {
			    // metadata уже загружены
			    $(this).siblings('.duration-record').html(timeFormat($(this).prop("duration").toFixed()*1000));
			}
      	})
	}
	initRecordArchive();


	$('.archive').on(UF.event_type, '.archive-audio', function() {
		var audio_source = UF.audio.find('source');

		audio_source.attr('src', $(this).find('.audio-info').attr('data-audio-url'));
		$('.player-progress').addClass('player-progress-active');
		togglePlayPause(UF.audio);
		//console.log(UF.audio.prop('buffered').end(0));
		UF.audio.on('progress', function() {
			var bufferedEnd = UF.audio.prop('buffered').end(0);
			var duration =  UF.audio.prop('duration');
			// console.log(duration);
			if (duration > 0) {
			console.log(bufferedEnd);
				console.log('duration > 0');
			  $('.player-progress-buffer').width = ((bufferedEnd / duration)*100) + "%";
			}
		});
		showDuration();
		// timer = setInterval(function (){
		// 	updateCurrentDuration(UF.audio);
		// }, 1000);
	})

	/*функция перемотки аудиозаписи*/
	$('.header .player-progress').on(UF.event_type, function(e) {
		console.log("sdfudfhyudb");
		var x = e.offsetX == undefined? e.layerX : e.offsetX,
  			y = e.offsetY == undefined? e.layerY : e.offsetY,
  			percent = (x / $(this).width() * 100).toFixed(),
  			progressValRewind = $('.player-progress'),
  			lengthAudio = $(UF.audio).prop('duration');

  		progressValRewind.width(percent + '%');
  		(UF.audio).prop("currentTime", lengthAudio * percent / 100);
	})

	$('.blog').on(UF.event_type, '.play-btn', function () {
		if ($(this).hasClass('stop')) {
			$(this).siblings('audio').trigger('play');
			console.log($(this));
		} else {
			$(this).siblings('audio').trigger('pause');	
		}
	})
    
    $('.nc-sub-item').on('click', function() {
        $('.nc-sub-item').removeClass('nc-sub-item-selected');
        $(this).addClass('nc-sub-item-selected');
    })


   // прижимаем плеер при скролле
    var elem_top = $('.player').offset().top;
    var header = $(".header");
    $(window).scroll(function(){
 	    var elem = $('.player');
    	var top = $(this).scrollTop();
      	if (top < 169) {
       		header.removeClass("lower");
    		elem.addClass("no-press");
        	elem.removeClass("press");
      	}else{
      		elem.addClass("press");
      		elem.removeClass("no-press");
      		header.addClass("lower");
      	}	
    });


   	$('.fs-input').focus(function () {
		$('.form-search').addClass('active');
		$('.fs-btn').addClass('search_active');
		$('.mCSB_container').css('margin-right', '0px');
	})

	$('.fs-input').focusout(function () {
		$('.form-search').removeClass('active');
		$('.fs-btn').removeClass('search_active');
		$('.mCSB_container').css('margin-right', '30px');
	})

	$('.blog').hover(
		function () {
			showScroll('#mCSB_1_scrollbar_vertical');
		},
		function () {
			hideScroll('#mCSB_1_scrollbar_vertical');
		}
	)
	$('.archive').hover(
		function () {
			showScroll('#mCSB_2_scrollbar_vertical');
		},
		function () {
			hideScroll('#mCSB_2_scrollbar_vertical');
		}
	)


	$("#slider" ).slider({
    	animate: true, 
        	     range: "min",
        	     value: 0.5,
        	     min: 0, 
        	     max: 1,
		         step: 0.01,
		         slide: function( event, ui ) {
            	   $('#audio').prop("volume", ui.value);
        	     }
	});

	$("#slider" ).hover(
		function() {
			$('.ui-slider-handle').addClass('over-slider-handle');
			$('.ui-slider-range').addClass('over-slider-range');
  		}, function() {
			$('.ui-slider-handle').removeClass('over-slider-handle');
			$('.ui-slider-range').removeClass('over-slider-range');
  		}
	)

    function getAudioArchive() {
        //TODO
    }

    function playStopPlayer() {
        if (UF.player.state == 'play') {
            $("#audio").trigger('pause');
            UF.player.state = 'pause';
            $(this).removeClass('player-btn-pause');
            $('.player-progress').removeClass('player-progress-active');
        } else {
            $("#audio").trigger('load');
            $("#audio").trigger('play');
            UF.player.state = 'play';
            $(this).addClass('player-btn-pause');
            $('.player-progress').addClass('player-progress-active');

    
        }	
    }

    /*перевод unixTime*/
 	function timeFormat() {
    	function num(val){
        	val = Math.floor(val);
        	return val < 10 ? '0' + val : val;
    	}
   		return function (ms){
        	var sec = ms / 1000, 
        		hours = sec / 3600  % 24, 
        		minutes = sec / 60 % 60, 
        		seconds = sec % 60;
        	return num(hours) + ":" + num(minutes) + ":" + num(seconds);
    	}
	}
    

    function showDuration() {
    	$(UF.audio).on('timeupdate', function() {
    		//console.log('the time was updated to: ' + this.currentTime);
    		var sec = parseInt($(UF.audio).prop("currentTime") % 60),
		        min = parseInt($(UF.audio).prop("currentTime") / 60) % 60,
        	    percentage = 0;
			if (sec < 10) {
				sec = '0' + sec;
			}
			UF.audio_current_time.html(min + ':' + sec);
			if ($(UF.audio).prop("currentTime") > 0) {	
   				percentage = Math.floor((100 / $(UF.audio).prop("duration")) * $(UF.audio).prop("currentTime"));
			}
   			$('.player-progress-val').width(percentage + "%");
		});
	}
    
    function convertUnixtime(timestamp, render) {
  		var d = new Date(render(timestamp) * 1000),
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	
			dd = ('0' + d.getDate()).slice(-2),				
			time = dd + '.' + mm + '.' + yyyy;					
		return render(time);
    }

    function getTemplate(src_template) {
  		$.get(src_template, renderingTemplate);
	}

	function renderingTemplate(template) {
  		var html = Mustache.render(template, view);
  
  		return html;
	}

	function hideScroll (name_scroll) {
		$(name_scroll).css('opacity', '0');
	}

	function showScroll (name_scroll) {
		$(name_scroll).css('opacity', '1');
	}
    
    function protectEmail () {
    	var login  = 'zombie';
		var server = 'ultima.pro';
		var email  = login+'@'+server;
		var url = 'mailto:'+email;
		$('.mail').html('<a href="' + url + '">' + email + '</a>');	
    }
	
})


	
