'use strict'
$(function(){

	if (!UF) var UF = {};
	UF.api_ultima = 'http://api.ultima.fm';
	UF.stream = 'http://sc.ultima.fm:8001/stream/1/stream.mp3';
    UF.audio = $('#audio');
    UF.audio_source = UF.audio.find('source');
    UF.audio_duration = UF.audio.attr('data-duration', 0);
    UF.audio_current_time = $('.player-progress .pp-text-left');
    UF.event_type = 'click';
    UF.player_button = $('.player-btn');
    UF.player_progress = $('header .player-progress');
    UF.player_progress_val = $('.player-progress-val');
    UF.player_timer;
	UF.player = {
		el: $('.player')[0],
		el_play:  $('#audio')[0],
		el_author:  $('.player-track-artist'),
		el_song:  $('.player-track-title'),
		duration: $('.pp-text-right'),
		state: 'pause',
        setVolume: function() {
            $(UF.player.el_play).prop("volume", "0.5");   
        },
		updateMeta: function() {
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
	getStatisticUsers();
	loadPostBlog();
	loadAudioArchive();
    
	setInterval(function(){
		UF.player.updateMeta();
	}, 5000);

	setInterval(function() {
		getStatisticUsers();
	}, 60000);


	$('.live').on(UF.event_type, function() {
		UF.audio_source.attr('src', UF.stream);
		$('header').removeClass('player-archive').addClass('player-live');
		changePlayer('block');

		//TODO stop event progress
		$('.player-progress-buffer').hide();
	});

	$('body').on(UF.event_type, '.audio', function() {
		var audio_duration = $(this).find('.audio-duration').text(),
		    audio_author   = $(this).find('.ai-singer').text(),
		    audio_song     = $(this).find('.ai-title').text();

		if (!$('.player-archive').length) {
			$('header').removeClass('player-live').addClass('player-archive ');
        	changePlayer('none');
		}
		UF.player.el_author.text(audio_author);
		UF.player.el_song.text(audio_song);
		UF.player.duration.text(audio_duration);
	});

	$('body').on(UF.event_type, '.archive-audio', function() {
		$('.archive-audio').removeClass('archive-audio-playing');
		$(this).addClass('archive-audio-playing');
	})

	$('.archive-form-search').keyup(function(){
		var search_val = $(".archive-form-search").find(".afs-input").val();
		//console.log(search_val);
  		searchRecordsArchive(search_val);
	});

	$('.archive').on(UF.event_type, '.archive-audio', function() {
		UF.audio_source.attr('src', $(this).find('.audio-info').attr('data-audio-url'));
		$('.player-progress').addClass('player-progress-active');
		togglePlayPause();
	});

	UF.player_progress.on(UF.event_type, function(e) {
		recordRewind(e);
	})

	$('.blog').on(UF.event_type, '.play-btn', function () {
		if ($(this).hasClass('stop')) {
			$(this).siblings('audio').trigger('play');
			console.log($(this));
		} else {
			$(this).siblings('audio').trigger('pause');	
		}
	});
    
    $('.nc-sub-item').on(UF.event_type, function() {
        $('.nc-sub-item').removeClass('nc-sub-item-selected');
        $(this).addClass('nc-sub-item-selected');
    });


   	$('.afs-filter').on(UF.event_type, function () {
   		$('.nav-calendar').slideToggle('slow');
  		$('.nav-calendar').toggleClass('nav-calendar-active');
  		$(this).toggleClass('ultima-icon-filter ultima-icon-filter-active');
  		$('.archive-form-search-wrap').toggleClass('archive-form-search-wrap-active')
	});
	
	$('.afs-input').focus(function() {
		$('.archive-form-search').addClass('archive-form-search-active');
	});

	$('.afs-input').focusout(function() {
		$('.archive-form-search').removeClass('archive-form-search-active');
	});

	$('.blog').hover(
		function() {
			showScroll('#mCSB_2_scrollbar_vertical');
		},
		function() {
			hideScroll('#mCSB_2_scrollbar_vertical');
		}
	)
	$('.archive').hover(
		function() {
			showScroll('#mCSB_1_scrollbar_vertical');
		},
		function() {
			hideScroll('#mCSB_1_scrollbar_vertical');
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

	function calendarWidget() {
		var today = new Date();
		var this_month = today.getMonth();
		var this_year = today.getFullYear();
		var month_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']; 
	}

	function getDaysInMonth(month,year)  {
		var days_month = [31,28,31,30,31,30,31,31,30,31,30,31];
		if ((month == 1) && (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0))){
		  return 29;
		}else{
		  return days_month[month];
		}
	}

	function changePlayer(visible) {
		$(".player-track").fadeOut(300, function () {
            $('.broadcast').css({'display': visible});
        }).fadeIn(300);
	}

	function loadAudioArchive() {
    	var archive = $('.archive .archive-wrapper');
    	var view = {};
    	$.ajax({	
    		type: 'GET',
     		url: UF.api_ultima + '/played_songs.json?page[10]',
     		dataType: "json",
     		success: function (data) {
     			view = data || {};
       			view.convertUnixtime = function () {
					return function (timestamp, render) {
   						return convertUnixtime(timestamp, render);	
   					}
   				}
   				view.timeFormat = function () {
					return function (ms, render) {
   						return timeFormat(ms, render);	
   					}
   				}
   	
  				getTemplate('../views/archive_audio.html', archive, view);
     		}
		})	
	}

    function loadPostBlog() {
    	var blog = $('.blog .blog-wrapper'),
    	    view = {};
    	$.ajax({	
    		type: 'GET',
     		url: UF.api_ultima + '/posts.json',
     		dataType: "json",
     		success: function (data) {
     			view = data || {};
       			view.convertUnixtime = function () {
					return function (timestamp, render) {
   						return convertUnixtime(timestamp, render);	
   					}
   				}
   				view.timeFormat = function () {
					return function (ms, render) {
   						return timeFormat(ms, render);	
   					}
   				}
   				getTemplate('../views/blog_post.html', blog, view);
     		}
		})
    }

    function updateBlog () {
		//TODO
	}

	function searchRecordsArchive(search_val) {
		$.ajax({	
    		type: 'GET',
     		url:  UF.api_ultima + '/played_songs.json?filter[audio_artist_or_audio_title_cont]=' + search_val,
     		dataType: "json",
     		success: function (data) {
     			// console.log(data);
     		}
		});
	}

	function recordRewind(offset) {
		var x = offset.offsetX == undefined? offset.layerX : offset.offsetX,
  			percent = (x / UF.player_progress.width() * 100).toFixed(),
  			progressValRewind = UF.player_progress_val,
  			lengthAudio = $(UF.audio).prop('duration');

  		progressValRewind.css({
  			'transform'         : 'translateX(' + percent + "%" + ')',
            '-moz-transform'    : 'translateX(' + percent + "%" + ')',
			'-webkit-transform' : 'translateX(' + percent + "%" + ')'
  		});
  		(UF.audio).prop("currentTime", lengthAudio * percent / 100);	
	}

	function togglePlayPause() {
	   	if (UF.audio.prop("paused")) {
	   		UF.audio.trigger('load');
	   		UF.audio.trigger('play');
	   		UF.player_timer = setInterval(function (){
	   			showDuration();
			}, 50);
			showBuffer();
	   		UF.player_button.addClass('player-btn-pause');
	   	}
	   	else {	
	   		UF.audio.trigger('pause');
	   		UF.player_button.removeClass("player-btn-pause");
	    }

		UF.audio.on('ended', function() {
			console.log('end');	
			var next_track = $('.archive-audio-playing').next();
			console.log(!next_track.length);
			console.log($('.archive-audio').first());
            if (!next_track.length) next_track = $('.archive-audio').first();
            next_track.addClass('archive-audio-playing').siblings().removeClass('archive-audio-playing');
            UF.audio_source.attr('src', next_track.find('.audio-info').attr('data-audio-url'));
            UF.audio.trigger('load');
	   		UF.audio.trigger('play');
		});
  	}

    function playStopPlayer() {
        if (UF.player.state == 'play') {
            $("#audio").trigger('pause');
            UF.player.state = 'pause';
            $('.player-progress').removeClass('player-progress-active');
        } else {
            $("#audio").trigger('load');
            $("#audio").trigger('play');
            UF.player.state = 'play';
            $('.player-progress').addClass('player-progress-active');
        }	

        UF.player_button.toggleClass('ultima-icon-play ultima-icon-pause');
    }

    function showBuffer() {
    	UF.audio.on('progress', function() {
			var duration =  UF.audio.prop('duration'),
			    bufferedEnd = UF.audio.prop('buffered').end(0),
			    percent = (bufferedEnd / duration) * 100;
	
			if ((UF.audio.prop('buffered') != undefined) && (UF.audio.prop('buffered').length > 0)) {
			  $('.player-progress-buffer').css({ 'width' : percent + '%'});
			}
		});	
    }
   
    function showDuration() {
		var sec = parseInt($(UF.audio).prop("currentTime") % 60),
	        min = parseInt($(UF.audio).prop("currentTime") / 60) % 60,
    	    percentage = 0;
		if (sec < 10) {
			sec = '0' + sec;
		}
		UF.audio_current_time.html(min + ':' + sec);

		if ($(UF.audio).prop("currentTime") > 0) {	
			percentage = (100 / $(UF.audio).prop("duration")) * $(UF.audio).prop("currentTime");
		}
		if (percentage == 100) {
			clearInterval(UF.player_timer);
		}

		UF.player_progress_val.css({
			'transform'         : 'translateX(' + percentage + "%" + ')',
            '-moz-transform'    : 'translateX(' + percentage + "%" + ')',
			'-webkit-transform' : 'translateX(' + percentage + "%" + ')'
		});
	}

	function timeFormat (sec, render) {
		function num(val) {
        	val = Math.floor(val);
        	return val < 10 ? '0' + val : val;
    	}
    	var	seconds = render(sec) % 60,
    	    minutes = render(sec) / 60, 
    		hours = render(sec) / (60 * 60),
    		time;

    	if (Math.floor(hours) > 0) {
    		time = num(hours) + ":" + num(minutes) + ":" + num(seconds);
    	} else {
    		time = num(minutes) + ":" + num(seconds);	
    	}

    	return render(time);
	}
    
    function convertUnixtime(timestamp, render) {
  		var d = new Date(render(timestamp) * 1000),
			yyyy = d.getFullYear(),
			mm = ('0' + (d.getMonth() + 1)).slice(-2),	
			dd = ('0' + d.getDate()).slice(-2),				
			time = dd + '.' + mm + '.' + yyyy;					
		return render(time);
    }

    function getTemplate(from, where, data) {
  		$.get(from, function(template){
  			var result = Mustache.render(template, data);
  			where.html(result);
  			initScrollBarBlock(where);
  		});
	}

	function getStatisticUsers() {
		$.getJSON(UF.api_ultima + '/stats', function(data) {
			$('.fs-online .fsi-val').html(data.current_listeners);
			$('.fs-peak .fsi-val').html(data.peak_listeners);
			$('.fs-today .fsi-val').html(data.unique_listeners);
			$('.fs-yesterday .fsi-val').html(data.prev_day_unique_listeners);
		})
	}

	function initScrollBarBlock(block) {
		console.log(block.attr('class'));
		if (block.attr('class') == 'blog-wrapper') {
			$(".blog-wrapper").mCustomScrollbar({
		    	axis:"y",
		    	theme:"my-theme",
		    	callbacks: {
		    		onInit:function() {
		    			console.log("init blog");
					},
					onTotalScroll:function() {
		    			//TODO load more blog
						console.log('end blog');
					}	
		    	}
			});
		} else {
			$(".archive-wrapper").mCustomScrollbar({
				axis:"y",
				theme:"my-theme",
				callbacks: {
					onInit:function() {
						console.log("init archive");
					},
	        		onTotalScroll:function() {
						//TODO load more archive
	        			console.log('end archive');
	        		}
				}
			});	
		}
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

    function getTruncatedText(text, size) {
		var text_trunc = (text.replace(/(<([^>]+)>)/ig,"")).substr(0,size);
		text_trunc = text_trunc.length < text.length ? text_trunc.substr(0, text_trunc.lastIndexOf(' ')) : text_trunc;
	
		return text_trunc.length < text.length ? text_trunc + '...' : text_trunc;
	}
})


	
