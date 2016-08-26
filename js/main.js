'use strict'
$(function(){
    
    var button_player = $('.player-btn');

	var player = {
		el: $('.player')[0],
		el_play:  $('#audio')[0],
		el_author:  $('.player-track-artist')[0],
		el_song:  $('.player-track-title')[0],
		state: 'pause',
        setVolume: function() {
            $(player.el_play).prop("volume", "0.5");   
        },
		updateMeta: function() {
		//192.168.21.9:8001
		$.get("http://sc.ultima.fm:8001/currentsong?sid=1",
			function (data) {
				data = data || '';
				var meta =  data.split('-');
				$(player.el_author).html(meta[0]);
				$(player.el_song).html(meta[1]);
				console.log(data);
			});
		}
	}
    
    button_player.on('click', playStopPlayer);
	player.updateMeta();
    player.setVolume();
    protectEmail();
    
	setInterval(function(){
		player.updateMeta();
	}, 5000);

	$('.live').click(function() {
		$('.player').toggleClass('broadcasting');
	});


	var view;

    var getTemplate = function(src_template) {
  		$.get(src_template, renderingTemplate);
	}

	var renderingTemplate = function(template) {
  		var renderedPage = Mustache.render(template, view);
  
  		if ($("div").is("#mCSB_2_container")) {
			$('#mCSB_2_container').append($("#btn-show-more").before(renderedPage));	
  		} 
  		else {
  			$('#output').append($("#btn-show-more").before(renderedPage));
  		}

  		return renderedPage;
	}

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


	$(".archive-container").mCustomScrollbar({
    	axis:"y",
    	theme:"my-theme",
    	callbacks:{
	        onTotalScroll:function(){
	        	console.log('конец скролла ');
	        }
	    }
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
	//search_new_post();
	//search();
	var search_val;
	function search() {
		search_val = $(".form-search").find(".fs-input").val();
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
	

	$(".blog").on("click", ".play-btn", function() {
  		$(this).toggleClass('stop');
	});

	var timer;
	function togglePlayPause(obj) {
		var currentBtn = obj,
		    currentRecord = $(obj).find('audio');
			
		currentRecord.siblings('.progress').css('display', 'block');
		currentRecord.on('ended', function() {
			$(currentBtn).children('.play-pause-button').removeClass("pause");
		})

	   	$('.record-control').not(currentBtn).each(function() {
	   		$(this).children('.play-pause-button').removeClass("pause");
	   		$(this).siblings('.record').children(".progress").css('display', 'none');
	   	});

	   	if (currentRecord.prop("paused")) {
	   		$(currentBtn).children('.play-pause-button').addClass("pause");
	   		currentRecord.trigger('play');
	   		$('.duration-record').not(currentRecord.siblings('.duration-record')).each(function() {
	   			var d = ($(this).siblings('audio').prop("duration"));		
	   			$(this).html(timeFormat(d.toFixed()*1000));	
	   		})
	   		
	   		//останавливаем все песни кроме текущей
	   		$("audio").not(currentRecord).each(function() {
	   			$(this).trigger('pause');
	   			$(this).prop('currentTime', 0);
	   		})

	   		if (!cur_song) {
				cur_song = currentRecord;
				console.log('cur_song', cur_song);
			} else {
				prev_song = $(cur_song).closest('.record-archive');
				cur_song = currentRecord;
				prev_song.removeClass('current');
			}

	   		// убираем продложительность всех песен кроме текущей
			$(".progress-val").not(currentRecord.children('progress').children('progress-val')).each(function() {
	   			$(this).width(0 + '%');
	   		})
			clearInterval(timer);
	   	}
	   	else {	
	   		$(currentBtn).children('.play-pause-button').removeClass("pause");
	   		currentRecord.trigger('pause');
	    }
  	}

  	/*перевод unixTime*/
 	var timeFormat = (function (){
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
    	};
	})();

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


	$('.archive').on('click', '.archive-record', function() {
		var cur_audio = $(this).find('audio');

		togglePlayPause(this);
		$('.play-btn').removeClass('stop');
		$('.btn-player').removeClass('state-pause');
		$('.btn-player').addClass('state-play');
		$('.btn-player').find("#audio").trigger('pause');
		$(this).addClass('playing').siblings().removeClass('playing');
		console.log(cur_audio.prop('buffered').end(0));
		cur_audio.on('progress', function() {
			var bufferedEnd = cur_audio.prop('buffered').end(0);
			var duration =  cur_audio.prop('duration');
			if (duration > 0) {
			  $('.player-progress-buffer').width = ((bufferedEnd / duration)*100) + "%";
			}
		});
		timer = setInterval(function (){
			updateCurrentDuration(cur_audio);
		}, 1000);
	})

	/*функция перемотки аудиозаписи*/
	var progressBarRewind = $('.player-progress');
	progressBarRewind.on('click', function(e) {
		var x = e.offsetX==undefined?e.layerX:e.offsetX,
  			y = e.offsetY==undefined?e.layerY:e.offsetY,
  			percent = (x / $(this).width() * 100).toFixed(),
  			progressValRewind = $(this).children('.player-progress-val'),
  			audio = $(this).siblings('audio'),
  			lengthAudio = $(this).siblings('audio').prop('duration');

  		progressValRewind.width(percent + '%');
  		audio.prop("currentTime", lengthAudio * percent / 100);
	})

	$('.blog').on('click', '.play-btn', function () {
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

	function hideScroll (name_scroll) {
		$(name_scroll).css('opacity', '0');
	}

	function showScroll (name_scroll) {
		$(name_scroll).css('opacity', '1');
	}

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
        if (player.state == 'play') {
            $("#audio").trigger('pause');
            player.state = 'pause';
            $(this).removeClass('player-btn-pause');
            $('.player-progress').removeClass('player-progress-active');
        } else {
            $("#audio").trigger('load');
            $("#audio").trigger('play');
            player.state = 'play';
            $(this).addClass('player-btn-pause');
            $('.player-progress').addClass('player-progress-active');
            $('.playing').find('audio').trigger('pause');
            // $('.current').find('audio').prop('currentTime', 0);
            $('.playing').find('.play-pause-button').removeClass('pause');

            // console.log($('.current').find('.progress'));
            $('.playing').find('.progress').addClass('hide_progress');
            if (cur_dur) {
                var cur_text_dur = $('.playing').find('.duration-record');
                var cur_dur = timeFormat(cur_song[0].duration.toFixed()*1000);
                $(cur_text_dur).html(cur_dur);
            }
        }	
    }
    
    function updateCurrentDuration (audio) {
		var sec = parseInt($(audio).prop("currentTime") % 60),
		    min = parseInt($(audio).prop("currentTime") / 60) % 60,
        	percentage;

		if (sec < 10) {
			sec = '0' + sec;
		}
        
		$(audio).siblings(".duration-record").html(min + ':' + sec);
   		percentage = Math.floor((100 / $(audio).prop("duration")) * $(audio).prop("currentTime"));
   		$('.player-progress-val').width(percentage + "%");
	}
    
    function convertUnixtime(timestamp, render) {
  		var d = new Date(render(timestamp) * 1000),
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	
			dd = ('0' + d.getDate()).slice(-2),				
			time = dd + '.' + mm + '.' + yyyy;					
		return render(time);
    }
    
    function protectEmail () {
    	var login  = 'zombie';
		var server = 'ultima.pro';
		var email  = login+'@'+server;
		var url = 'mailto:'+email;
		$('.mail').html('<a href="' + url + '">' + email + '</a>');	
    }
	
})


	
