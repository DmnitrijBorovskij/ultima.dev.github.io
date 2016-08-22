'use strict'
$(function(){

	var player = {
		el: $('.player')[0],
		el_play:  $('#audio')[0],
		el_author:  $('.artist-track')[0],
		el_song:  $('.title-track')[0],
		state: 'pause',
		updateMeta: function () {
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

	$('.live').click(function() {
		$('.player').toggleClass('broadcasting');
	});

	var connectionSpeed = {
		player: $('#audio').find('source')[0],
		high_bitrate: 'http://sc.ultima.fm:8001/stream/1/stream.mp3',
	    avg_bitrate: 'http://sc.ultima.fm:8001/stream/2/stream.mp3',
	    low_bitrate: 'http://sc.ultima.fm:8001/stream/3/stream.mp3',
	    checkspeed: false,
	    speed: 0,
	    defineBitrate : function(speed) {
	        if (speed > 2048) {
	            connectionSpeed.player.src = connectionSpeed.high_bitrate;
	        }
	        if (speed < 2048 && speed > 512) {
	            connectionSpeed.player.src = 'http://sc.ultima.fm:8001/stream/2/stream.mp3';
	        }
	        if (speed < 512) {
	            connectionSpeed.player.src = 'http://sc.ultima.fm:8001/stream/3/stream.mp3';
	        }
    	},
	    measureSpeed : function() {
	        var image_addr = "http://turismfoto.ru/albums/userpics/10001/Priroda_Belarusi1.jpg";
	        //var image_addr = "http://ultima.fm/wp-content/themes/ultima/images/Priroda.jpg";
	        var download_size = 797526; //bytes
	        var startTime, endTime;
	        var download = new Image();
	        startTime = (new Date()).getTime();
	        var cache_buster = "?n=" + startTime;
	        download.src = image_addr + cache_buster;
	        download.onload = function () {
	            endTime = (new Date()).getTime();
	            var duration = (endTime - startTime) / 1000;
	            var bits_loaded = download_size * 8;
	            var speed_bps = (bits_loaded / duration).toFixed(2);
	            var speed_kbps = (speed_bps / 1024).toFixed(2);
	            console.log("connection speed is: " + speed_kbps + " kbps");
	            connectionSpeed.checkspeed = true;
	            connectionSpeed.speed = speed_kbps;
	            return connectionSpeed.checkspeed;
	        };
	    }
	};
	connectionSpeed.checkspeed = connectionSpeed.measureSpeed();


	var view;
	function convertUnixtime(timestamp, render) {
  		var d = new Date(render(timestamp) * 1000),
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	
			dd = ('0' + d.getDate()).slice(-2),				
			time = dd + '.' + mm + '.' + yyyy;					
		return render(time);
    }

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

		$(".blog").mCustomScrollbar({
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

	var playStopPlayer = function() {
		if (player.state == 'play') {
			$("#audio").trigger('pause');
			player.state = 'pause';
			$(this).addClass('state-play');
			$(this).removeClass('state-pause');
		} else {
			if (connectionSpeed.checkspeed) {
				connectionSpeed.defineBitrate(connectionSpeed.speed);
    		} else {
    			connectionSpeed.player.src = connectionSpeed.avg_bitrate;
    		}
			$("#audio").trigger('load');
			$("#audio").trigger('play');
			player.state = 'play';
			$(this).addClass('state-pause');
			$(this).removeClass('state-play');
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
	};

	var cur_song, prev_song;
	$('.btn-player').on('click', playStopPlayer);
	
	player.updateMeta();

    $('#audio').prop("volume", "0.5")
	setInterval(function(){
		player.updateMeta();
	}, 5000);

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

	function updateProgressBar (obj) {
		var currentRecord = obj,
		    sec = parseInt($(currentRecord).prop("currentTime") % 60),
		    min = parseInt($(currentRecord).prop("currentTime") / 60) % 60,
        	percentage;

		if (sec < 10) {
			sec = '0' + sec;
		}
		$(currentRecord).siblings(".duration-record").html(min + ':' + sec);
   		percentage = Math.floor((100 / $(currentRecord).prop("duration")) * $(currentRecord).prop("currentTime"));
   		$('.player-progress-val').width(percentage + "%");
	}

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
			updateProgressBar(cur_audio);
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

	/*показываем(скрываем) вкладки Блог-Архив*/
    var archive = $(".archive"),
    	blog    = $(".blog"),
    	tab     = $(".tab"),
    	tab_one = $(".tab:nth-of-type(1)"),
    	tab_two = $(".tab:nth-of-type(2)");

    tab.on("click", function () {
		blog.add(archive).toggleClass("show");
		tab_one.add(tab_two).toggleClass("show-tab hide-tab");
    })

    function protectEmail () {
    	var login  = 'zombie';
		var server = 'ultima.pro';
		var email  = login+'@'+server;
		var url = 'mailto:'+email;
		$('.mail').html('<a href="' + url + '">' + email + '</a>');	
    }
   	protectEmail();

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
			showScroll('#mCSB_2_scrollbar_vertical');
		},
		function () {
			hideScroll('#mCSB_2_scrollbar_vertical');
		}
	)
	$('.archive').hover(
		function () {
			showScroll('#mCSB_1_scrollbar_vertical');
		},
		function () {
			hideScroll('#mCSB_1_scrollbar_vertical');
		}
	)
	if (window.matchMedia("(max-width: 768px)").matches) {
		$(".footer-address").before($('.footer-icons'));
	}

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

	
	
})

	
