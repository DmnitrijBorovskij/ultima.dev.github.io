'use strict'
$(function() {

	if (!UF) var UF = {};
	UF.api_ultima = 'http://api.ultima.fm';
	UF.stream = 'http://sc.ultima.fm:8001/stream/1/stream.mp3';
	UF.curr_audio;
	UF.prev_audio;
	UF.audio = $('#audio');
	UF.audio_source = UF.audio.find('source');
	UF.audio_duration = UF.audio.attr('data-duration', 0);
	UF.audio_current_time = $('.player-progress .pp-text-left');
	UF.event_type = 'click';
	UF.player_button = $('.player-btn');
	UF.player_progress = $('.player-progress');
	UF.player_progress_val = $('.player-progress-val');
	UF.player_timer;
	UF.live_timer;
	UF.search =  $(".archive-form-search").find(".afs-input").val();
	UF.player = {
		el: $('.player')[0],
		el_play: $('#audio')[0],
		el_author: $('.player-track-artist'),
		el_song: $('.player-track-title'),
		duration: $('.pp-text-right'),
		state: 'pause',
		setVolume: function() {
			$(UF.player.el_play).prop("volume", "0.5");
		},
		updateMeta: function() {
			$.get("http://sc.ultima.fm:8001/currentsong?sid=1",
				function(data) {
					data = data || '';
					var meta = data.split('-');
					$(UF.player.el_author).html(meta[0]);
					$(UF.player.el_song).html(meta[1]);
					//console.log(data);
				}
			);
		}
	}

	UF.player_button.on(UF.event_type, playStopPlayer);
	UF.player.updateMeta();
	UF.player.setVolume();
	protectEmail();
	getStatisticUsers();
	loadPostBlog();
	loadAudioArchive();

	UF.live_timer = setInterval(function() {
		UF.player.updateMeta();
	}, 5000);

	setInterval(function() {
		getStatisticUsers();
	}, 60000);


	$('.live').on(UF.event_type, function() {
		UF.audio_source.attr('src', UF.stream);
		UF.player.state = 'pause';
		$('header').removeClass('player-archive').addClass('player-live');
		$('.audio-playing').removeClass('audio-playing');
		console.log(UF.player.state);
		playStopPlayer();
		changePlayer('block');
		UF.player.updateMeta();
		UF.live_timer = setInterval(function() {
			UF.player.updateMeta();
		}, 5000);

		//TODO stop event progress
		$('.player-progress-buffer').hide();
	});

	$('body').on(UF.event_type, '.audio', function() {
		var audio_curr = $(this),
		    audio_duration = $(this).find('.audio-duration').text(),
			audio_author = $(this).find('.ai-singer').text(),
			audio_song = $(this).find('.ai-title').text();
			// console.log($(this).attr('class'));
			//console.log($('.archive-audio').attr('class'));

		if (!$('.player-archive').length) {
			$('header').removeClass('player-live').addClass('player-archive ');
			changePlayer('none');
		}

		if (!audio_curr.hasClass('audio-playing')) {
			UF.player.state = 'pause';
			UF.audio_source.attr('src', audio_curr.find('.audio-info').attr('data-audio-url'));
			UF.player_progress.addClass('player-progress-active');
			$('.audio').removeClass('audio-playing');
			audio_curr.addClass('audio-playing');
		} else {
			UF.player.state = 'play';
			audio_curr.removeClass('audio-playing');
		}
		togglePlayPause();

		

		// //console.log(audio_curr);
		// //UF.curr_audio = audio_curr;
		// // console.log(UF.curr_audio == audio_curr);
		// if (UF.curr_audio == audio_curr) {
		// 	UF.player.state = 'play';
			
		// } else {
		// 	UF.player.state = 'play';
		// }
		// // if (!UF.curr_audio == audio_curr) {
		// // 	UF.curr_audio = audio_curr;

		// // } else {
		// // 	UF.player.state = 'play';
		// // 	UF.audio.trigger('pause');
		// // }

				
		clearInterval(UF.live_timer);
		UF.player.state = 'play';
		UF.player.el_author.text(audio_author);
		UF.player.el_song.text(audio_song);
		UF.player.duration.text(audio_duration);
		$(document).attr('title', audio_author + ' - ' + audio_song);
	});

	$('.archive-form-search').keyup(function() {
		UF.search = $(".archive-form-search").find(".afs-input").val();
		searchRecordsArchive(UF.search);
	});

	$('.blog').on(UF.event_type, '.post-audio', function() {
		// var current_audio = $(this);
		// if (!current_audio.hasClass('audio-playing')) {
		// 	UF.player.state = 'pause';
		// 	UF.audio_source.attr('src', current_audio.find('.audio-info').attr('data-audio-url'));
		// 	UF.player_progress.addClass('player-progress-active');
		// 	$('.post-audio').removeClass('audio-playing');
		// 	current_audio.addClass('audio-playing');
		// } else {
		// 	UF.player.state = 'play';
		// 	current_audio.removeClass('audio-playing');
		// }
		// togglePlayPause();
	});

	$('.archive').on(UF.event_type, '.archive-audio', function() {
		// var current_audio = $(this);
		// if (!current_audio.hasClass('audio-playing')) {
		// 	UF.audio_source.attr('src', current_audio.find('.audio-info').attr('data-audio-url'));
		// 	UF.player_progress.addClass('player-progress-active');
		// 	$('.archive-audio').removeClass('audio-playing');
		// 	current_audio.addClass('audio-playing');
		// }
		// togglePlayPause();
	});

	UF.player_progress.on(UF.event_type, function(e) {
		recordRewind(e);
	})


	$('.afs-filter').on(UF.event_type, function() {
		$('.nav-calendar').slideToggle('slow');
		$('.nav-calendar').toggleClass('nav-calendar-active');
		$(this).toggleClass('afs-filter-open');
		$('.archive-form-search-wrap').toggleClass('archive-form-search-wrap-active')
	});

	$('.afs-input').focus(function() {
		$('.archive-form-search').addClass('archive-form-search-active');
	});

	$('.afs-input').focusout(function() {
		$('.archive-form-search').removeClass('archive-form-search-active');
	});

	$("#slider").slider({
		animate: true,
		range: "min",
		value: 0.5,
		min: 0,
		max: 1,
		step: 0.01,
		slide: function(event, ui) {
			$('#audio').prop("volume", ui.value);
		}
	});

	var calendarWidget = (function() {
		//TODO do main object time
		var month_names = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
		var days_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		var today = new Date();
		var curr_year = today.getFullYear();
		var curr_month = today.getMonth();
		var curr_day = today.getDate();
		var curr_hours = (function() {
			return (today.getHours() < 10 ? '0' : '') + today.getHours() + ':00';
		}());

		return {
			onInit: function() {
				calendarWidget.showDaysMonth();
				$('.nav-calendar-year-section .ncys-item:contains(' + curr_year + ')').addClass('nc-sub-item-selected');
				$('.nav-calendar-month-section .ncms-item[data-id-month=' + curr_month + ']').addClass('nc-sub-item-selected').nextAll('.nc-sub-item').addClass('future');
				$('.nav-calendar-day-section .ncds-item:contains(' + curr_day + ')').addClass('nc-sub-item-selected').nextAll('.nc-sub-item').addClass('future');
				$('.nav-calendar-time-section .ncts-item:contains(' + curr_hours + ')').addClass('nc-sub-item-selected').nextAll('.nc-sub-item').addClass('future');
				$('.nc-sub-item').each(function() {
					//console.log($(this).text());
					//console.log('===============');
					//console.log($('.nc-sub-item-selected').text());
					//$(this).text() > $('.nc-sub-item-selected').text() ? $(this).addClass('future') : '';
				});
			},
			getDaysInMonth: function(month, year) {
				//console.log(month, year);
				if ((month == 1) && (year % 4 == 0) && ((year % 100 != 0) || (year % 400 == 0))) {
					return 29;
				} else {
					return days_month[month];
				}
			},
			showDaysMonth: function() {
				var year = $('.nav-calendar-year-section .nc-sub-item-selected').text() || curr_year;
				var month = $('.nav-calendar-month-section .nc-sub-item-selected').attr('data-id-month') || curr_month;
				//console.log(year);
				//console.log(month);
				var count_day_month = calendarWidget.getDaysInMonth(month, year);
				var month_html = '';
				var middle_month = 17;
				for (var i = middle_month; i <= count_day_month; i++) {
					month_html += ('<div class="ncds-item nc-sub-item">'+ i +'</div>');
				}
				$('.nav-calendar-day-section .nc-row').eq(1).html(month_html);
			},
			searchRecords: function() {
				var select_year = $('.nc-sub-item-selected').eq(0).text();
				var select_month = $('.nc-sub-item-selected').eq(1).text()
				var select_day = $('.nc-sub-item-selected').eq(2).text();
				var select_hour = $('.nc-sub-item-selected').eq(3).attr('data-hour');
				//console.log('tttttttttttt');
				//console.log(select_year);
				//console.log(select_month);
				//console.log(select_day);
				//console.log(select_hour);
				var period = get_constraints(select_year, select_month, select_day, select_hour);
				//console.log('period');
				//console.log(period);
			}
		}
	}());
	calendarWidget.onInit();

	$('.nav-calendar-year-section, .nav-calendar-month-section').on(UF.event_type, '.nc-sub-item', function() {
		if (!$(this).hasClass('future')) {
			$(this).closest('.nc-item').find('.nc-sub-item-selected').removeClass('nc-sub-item-selected');
			$(this).addClass('nc-sub-item-selected');
			calendarWidget.showDaysMonth();
		}
	});

	$('.nav-calendar').on(UF.event_type, '.nc-sub-item', function() {
		//console.log($(this).hasClass('future'));
		if (!$(this).hasClass('future')) {
			$(this).closest('.nc-item').find('.nc-sub-item-selected').removeClass('nc-sub-item-selected');
			$(this).addClass('nc-sub-item-selected');
			calendarWidget.searchRecords();			
		}
	});

 
	function get_constraints(year, month, day, hour) {
		var map = [
	   		[2015, 2017],
	   		[0, 11],
	   		[1, 31],
	   		[0, 23]
	 	]
	 	var result = [year, month, day, hour].reduce(function (p, c, i, a) {
	   		p[0].push(c || map[i][0])
	   		if (i == 2 && !c && p[1][p.length - 1]) {
	     		p[1][p.length - 1]++;
	     		p[1].push(0);
	   		} else {
	     		p[1].push(c || map[i][1])
	   		}

	   		return p
	 	}, [[], []])

	 	result[0].push(0, 0)
	 	result[1].push(59, 59)
	 	return result.map(function (p) {
	   		p.unshift(null);
	   		return (new ( Function.prototype.bind.apply(Date, p))).getTime()/1000
	 	})
	}


	function changePlayer(visible) {
		$(".player-track").fadeOut(300, function() {
			$('.broadcast').css({
				'display': visible
			});
		}).fadeIn(300);
	}

	function loadAudioArchive() {
		var archive = $('.archive .archive-wrapper'),
			count_records = $('.archive-wrapper').attr('data-count-archive-record'),
			page_archive = $('.archive-wrapper').attr('data-page-archive'),
			view = {};
		$.ajax({
			type: 'GET',
			url: UF.api_ultima + '/played_songs',
			dataType: "json",
			data: {
				"page[size]": count_records,
				"page[number]": page_archive
			},
			success: function(data) {
				view = data || {};
				view.convertUnixtime = function() {
					return function(timestamp, render) {
						return convertUnixtime(timestamp, render);
					}
				}
				view.timeFormat = function() {
					return function(ms, render) {
						return timeFormat(ms, render);
					}
				}

				renderTemplate('../views/archive_audio.html', archive, view);
				$('.archive-wrapper').attr('data-page-archive', parseInt(page_archive) + 1);
			}
		})
	}

	function loadPostBlog() {
		var blog = $('.blog .blog-wrapper'),
			count_posts = $('.blog-wrapper').attr('data-count-posts'),
			page_posts = $('.blog-wrapper').attr('data-page-posts'),
			view = {};

		$.ajax({
			type: 'GET',
			url: UF.api_ultima + '/posts',
			dataType: "json",
			data: {
				"page[size]": count_posts,
				"page[number]": page_posts
			},
			success: function(data) {
				view = data || {};
				view.convertUnixtime = function() {
					return function(timestamp, render) {
						return convertUnixtime(timestamp, render);
					}
				}
				view.timeFormat = function() {
					return function(ms, render) {
						return timeFormat(ms, render);
					}
				}
				renderTemplate('../views/blog_post.html', blog, view);
				$('.blog-wrapper').attr('data-page-posts', parseInt(page_posts) + 1);
			}
		})
	}

	function updateBlog() {
		//TODO
	}

	function searchRecordsArchive(search_val) {
		$.ajax({
			type: 'GET',
			url: UF.api_ultima + '/played_songs?filter[audio_artist_or_audio_title_cont]=' + search_val,
			dataType: "json",
			success: function(data) {
				var archive = $('.archive .archive-wrapper'),
					view = {};

				view = data || {};
				view.convertUnixtime = function() {
					return function(timestamp, render) {
						return convertUnixtime(timestamp, render);
					}
				}
				view.timeFormat = function() {
					return function(ms, render) {
						return timeFormat(ms, render);
					}
				}
				$('.archive-audio').remove();
				renderTemplate('../views/archive_audio.html', archive, view);
			}
		});
	}

	function highlight (string) {
        $('.archive .ai-text').each(function () {
        	if ($(this).text().toLowerCase().indexOf("" + string.toLowerCase() + "") != -1) {
            	var matchStart = $(this).text().toLowerCase().indexOf("" + string.toLowerCase() + "");
            	var matchEnd = matchStart + string.length - 1;
            	var beforeMatch = $(this).text().slice(0, matchStart);
            	var matchText = $(this).text().slice(matchStart, matchEnd + 1);
            	var afterMatch = $(this).text().slice(matchEnd + 1);
            	$(this).html(beforeMatch + "<span class='highlight'>" + matchText + "</span>" + afterMatch);
        	}
        });
    };

	function recordRewind(offset) {
		var x = offset.offsetX == undefined ? offset.layerX : offset.offsetX,
			percent = (x / UF.player_progress.width() * 100).toFixed(),
			progressValRewind = UF.player_progress_val,
			lengthAudio = $(UF.audio).prop('duration');

		progressValRewind.css({
			'transform': 'translateX(' + percent + "%" + ')',
			'-moz-transform': 'translateX(' + percent + "%" + ')',
			'-webkit-transform': 'translateX(' + percent + "%" + ')'
		});
		(UF.audio).prop("currentTime", lengthAudio * percent / 100);
	}

	function togglePlayPause() {
		//console.log(UF.player.state);
		if (UF.player.state == 'pause') {
			UF.audio.trigger('load');
			UF.audio.trigger('play');
			UF.player_timer = setInterval(function() {
				showDuration();
			}, 50);
			showBuffer();
			UF.player_button.addClass('player-btn-pause');
		} else {
			UF.audio.trigger('pause');
			UF.player_button.removeClass("player-btn-pause");
		}

		UF.audio.on('ended', function() {
			var next_track = $('.audio-playing').next();
			if (!next_track.length) next_track = $('.archive-audio').first();
			next_track.addClass('audio-playing').siblings().removeClass('audio-playing');
			var audio_author = $('.archive-audio-playing .ai-singer').text();
			var audio_song = $('.audio-playing .ai-title').text();
			var audio_duration = $('.audio-playing .audio-duration').text();
			UF.player.el_author.text(audio_author);
			UF.player.el_song.text(audio_song);
			UF.player.duration.text(audio_duration);
			UF.audio_source.attr('src', next_track.find('.audio-info').attr('data-audio-url'));
			UF.audio.trigger('load');
			UF.audio.trigger('play');
			$(document).attr('title', audio_author + ' - ' + audio_song);
		});
	}

	function playStopPlayer() {
		console.log(UF.player.state);
		if (UF.player.state == 'play') {
			UF.audio.trigger('pause');
			UF.player.state = 'pause';
			$('.player-live').length ? UF.player_progress.removeClass('player-progress-active') : '';
			UF.player_button.removeClass('player-btn-pause')
		} else {
			//console.log($('.player-live').length);
			$('.player-live').length ? UF.audio.trigger('load') : ''; 
			UF.audio.trigger('play');
			UF.player.state = 'play';
			UF.player_progress.addClass('player-progress-active');
			UF.player_button.addClass('player-btn-pause');
		}

	}

	function showBuffer() {
		UF.audio.on('progress', function() {
			var duration = UF.audio.prop('duration'),
				bufferedEnd = UF.audio.prop('buffered').end(0),
				percent = (bufferedEnd / duration) * 100;

			if ((UF.audio.prop('buffered') != undefined) && (UF.audio.prop('buffered').length > 0)) {
				$('.player-progress-buffer').css({
					'width': percent + '%'
				});
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
			'transform': 'translateX(' + percentage + "%" + ')',
			'-moz-transform': 'translateX(' + percentage + "%" + ')',
			'-webkit-transform': 'translateX(' + percentage + "%" + ')'
		});
	}

	function timeFormat(sec, render) {
		function num(val) {
			val = Math.floor(val);
			return val < 10 ? '0' + val : val;
		}
		var seconds = render(sec) % 60,
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

	function renderTemplate(from, where, data) {
		$.get(from, function(template) {
			var result = Mustache.render(template, data);
			if (!where.hasClass('mCustomScrollbar')) {
				where.append(result);
				initScrollBarBlock(where);
				return false;
			}

			$(where).find('.mCSB_container').append(result);
			highlight(UF.search);
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
		if (block.hasClass('blog-wrapper')) {
			$(".blog-wrapper").mCustomScrollbar({
				axis: "y",
				theme: "my-theme",
				scrollInertia: 500,
				autoHideScrollbar: true,
				callbacks: {
					onInit: function() {

					},
					onTotalScroll: function() {
						//TODO load more blog
						loadPostBlog();
					}
				}
			});
		} else {
			$(".archive-wrapper").mCustomScrollbar({
				axis: "y",
				theme: "my-theme",
				scrollInertia: 500,
				autoHideScrollbar: true,
				callbacks: {
					onInit: function() {

					},
					onTotalScroll: function() {
						//TODO load more archive
						loadAudioArchive();
					}
				}
			});
		}
	}

	function protectEmail() {
		var login = 'zombie';
		var server = 'ultima.pro';
		var email = login + '@' + server;
		var url = 'mailto:' + email;
		$('.mail').html('<a href="' + url + '">' + email + '</a>');
	}

	function getTruncatedText(text, size) {
		var text_trunc = (text.replace(/(<([^>]+)>)/ig, "")).substr(0, size);
		text_trunc = text_trunc.length < text.length ? text_trunc.substr(0, text_trunc.lastIndexOf(' ')) : text_trunc;

		return text_trunc.length < text.length ? text_trunc + '...' : text_trunc;
	}
})