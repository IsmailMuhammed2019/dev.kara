/*!
 * jquery.instagramFeed
 *
 * @author Javier Sanahuja Liebana <bannss1@gmail.com>
 * @contributor csanahuja <csanahuja@gmail.com>
 *
 * https://github.com/jsanahuja/jquery.instagramFeed
 *
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module depending on jQuery.
        define(['jquery'], factory);
    } else {
        // No AMD. Register plugin with global jQuery object.
        factory(jQuery);
    }
}(function($){
    var defaults = {
        'host': "https://www.instagram.com/",
        'username': '',
        'tag': '',
        'container': '',
        'server_instagram_url': '',
        'after': null,
        'items': 6,
        'image_new_tab': '',
        'image_padding': '',
        'image_size': 640,
        'image_alt_tag': 0,
        'image_alt_label': '',
        'image_lazy_load': false,
        'cache_time': 60,
        'lazy_load_placeholder_width': '100%'
    };
    var image_sizes = {
        "150": 0,
        "240": 1,
        "320": 2,
        "480": 3,
        "640": 4
    };

    $.instagramFeed = function(opts){

        function on_get_insta_data(data) {
            if (typeof data === 'string') {
                try {
                    data = data.split("window._sharedData = ")[1].split("<\/script>")[0];
                } catch (e) {
                    console.error("Instagram Feed: It looks like the profile you are trying to fetch is age restricted.", 3);
                    return;
                }
                data = JSON.parse(data.substr(0, data.length - 1));
                data = data.entry_data.ProfilePage || data.entry_data.TagPage;

                var skipCaching = false;
                if (typeof data === "undefined") {
                    //not able to fetch it from instagram, try to fetch it from server
                    $.get({
                        url: options.server_instagram_url + 'fetch/content/cache_id/' + cache_data_key,
                        cache: false,
                        async: false
                    }, function(response) {
                        if (response.content) {
                            data = JSON.parse(response.content);
                        }
                    });

                    if (!data) {
                        var cache_data_raw = localStorage.getItem(cache_data_key);
                        if (cache_data_raw !== null) {
                            data = JSON.parse(cache_data_raw);
                            skipCaching = true;
                        }
                    }

                    if (!data) {
                        console.error("Instagram Feed: It looks like YOUR network has been temporary banned because of too many requests.", 4);
                        return;
                    }
                } else {
                    //fetched from instagram, store it also on server
                    $.post({
                        url: options.server_instagram_url + 'push/content',
                        data: {
                            'cache_id': cache_data_key,
                            'instagram_content': JSON.stringify(data)
                        }
                    });
                }
                if (!skipCaching && options.cache_time > 0) {
                    localStorage.setItem(cache_data_key, JSON.stringify(data));
                    localStorage.setItem(cache_data_key_cached, new Date().getTime());
                }
            }

            data = data[0].graphql.user || data[0].graphql.hashtag;
            window.wpLazyLoad = window.wpLazyLoad || {};

            if (options.container != "") {
                var html = "";

                //image size
                var image_index = 'original';
                if (options.image_size != 'original') {
                    image_index = typeof image_sizes[options.image_size] !== "undefined" ? image_sizes[options.image_size] : image_sizes[640];
                }

                if (typeof data.is_private !== "undefined" && data.is_private === true) {
                    html += '<p class="instagram_private"><strong>This profile is private</strong></p>';
                } else {
                    var imgs = (data.edge_owner_to_timeline_media || data.edge_hashtag_to_media).edges;
                    max = (imgs.length > options.items) ? options.items : imgs.length;

                    for(var i = 0; i < max; i++){
                        var url = "https://www.instagram.com/p/" + imgs[i].node.shortcode;
                        var image = imgs[i].node.display_url;

                        if (image_index != 'original') {
                            image = imgs[i].node.thumbnail_resources[image_index].src;
                        }

                        html +=     "    <a href='" + url + "' rel='noopener'" + options.image_new_tab + ">";
                        if (options.image_lazy_load) {
                            html += "<span style='width: auto; height: 320px; float: none; display: block; position: relative;'>";
                            html +=     "       <img style='max-width: "+ options.lazy_load_placeholder_width +" ;margin-left: 45%' src='" + window.wpLazyLoad.imageloader + "' class='lazy "+ options.image_padding + "'" + " data-original='" + image + "' ";
                        } else {
                            html +=     "       <img class='"+ options.image_padding + "'" + " src='" + image + "' ";
                        }
                        switch (options.image_alt_tag) {
                            case 1:
                                html +=     " alt='" + imgs[i].node.accessibility_caption + "'";
                                break;
                            case 2:
                                html +=     " alt='" + options.image_alt_label + "'";
                                break;
                        }
                        html +=     " />";
                        if (options.image_lazy_load) {
                            html += "</span>";
                        }
                        html +=     "    </a>";
                    }
                }
                $(options.container).html(html);
            }

            if (options.image_lazy_load) {
                $('img.lazy').lazyload({
                    effect: window.wpLazyLoad.effect || "fadeIn",
                    effectspeed: window.wpLazyLoad.effectspeed || "",
                    imageloader: window.wpLazyLoad.imageloader || "",
                    threshold: window.wpLazyLoad.threshold || "",
                    load: function () {
                        if ($(this).parents('.instagram-photos').length) {
                            $(this).parent().removeAttr("style");
                        }
                        $(this).css({'max-width':'100%'});
                        $(this).css({'margin-left':'0'});
                        setTimeout(function () {
                            $(window).scroll();
                        }, 500);
                    }
                });
            }

            if ((options.after != null) && typeof options.after === 'function') {
                var that = this;
                setTimeout(function(){ options.after.call(that); $('.shuffle-item img.use-padding').css('width', '98%') }, 1000);
            }
        }

        var options = $.fn.extend({}, defaults, opts);
        if(options.username == "" && options.tag == ""){
            console.error("Instagram Feed: Error, no username or tag found.");
            return false;
        }
        if(typeof options.get_raw_json !== "undefined"){
            console.warn("Instagram Feed: get_raw_json is deprecated. See use get_data instead");
            options.get_data = options.get_raw_json;
        }
        if(options.container == ""){
            console.error("Instagram Feed: Error, no container found.");
            return false;
        }

        var is_tag = options.username == "",
            url = is_tag ? options.host + "explore/tags/"+ options.tag : options.host + options.username + "/",
            cache_data = null,
            cache_data_key = 'instagramFeed_' + (is_tag ? 't_' + options.tag : 'u_' + options.username),
            cache_data_key_cached = cache_data_key + '_cached';

        if (options.cache_time > 0) {
            var cached_time = localStorage.getItem(cache_data_key_cached);
            if (cached_time !== null && parseInt(cached_time) + 1000 * 60 * options.cache_time > new Date().getTime()) {
                var cache_data_raw = localStorage.getItem(cache_data_key);
                if(cache_data_raw !== null){
                    cache_data = JSON.parse(cache_data_raw);
                }
            }
        }

        if (cache_data !== null) {
            on_get_insta_data(cache_data);
        } else {
            $.get(url, on_get_insta_data).fail(function (e) {
                console.error("Instagram Feed: Unable to fetch the given user/tag. Instagram responded with the status code: ", e.status);
            });
        }

        return true;
    };

}));
