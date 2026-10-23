$(window).on("load", function () {
    var someDate = new Date();
    var numberOfDaysToAdd = 15;
    var result = someDate.setDate(someDate.getDate() + numberOfDaysToAdd);
    var myDate = new Date(result);
    $('.homepage #from').val($.datepicker.formatDate('mm/dd/y', myDate));


    var someDatea = new Date();
    var numberOfDaysToAdda = 22;
    var resulta = someDate.setDate(someDatea.getDate() + numberOfDaysToAdda);
    var myDatea = new Date(resulta);
    $('.homepage #to').val($.datepicker.formatDate('mm/dd/y', myDatea));
});
$(document).ready(function () {

    //   $(document).mouseup(function(e) 
    //   {
    //       var container = $("#mysearchlist");
    //       var container2 = $("#mysearchlistdestination");
    //       // if the target of the click isn't the container nor a descendant of the container
    //       if (!container.is(e.target) && container.has(e.target).length === 0) 
    //       {
    //         $('#origin2').val('');
    //         //$('#check1').html('');

    //           container.hide();

    //       }
    //       if (!container2.is(e.target) && container2.has(e.target).length === 0) 
    //       {
    //         $('#destination2').val('');
    //         //$('#check2').html('');
    //         container2.hide();

    //       }
    //   });


    // $('#mysearchlist').mouseleave(function() {
    //     $('#mysearchlist').fadeOut();

    //    $('#mysearchlist').on("click",function()
    // {
    //     alert('hello');
    //     return false;

    // });
    //  $('#origin2').val('');
    //     $('#mysearchlist').hide();
    // });
    $('#pair').mouseleave(function () {
        $('#pair').fadeOut();
        ;
        $('#pair').hide();
    });

    $('.t1').hide();
    $('.t2').hide();
    $('.origin_focus').click(function () {
        $('#origin2').focus();
    });

    $('.spinorg').hide();
    $('.spindest').hide();
    $('#closeonclose').click(function () {
        $('#closeoncloseluist').show();
        $('#closeonclose').hide();
    });
    $('#closeoncloseluist').click(function () {
        $('#closeonclose').show();
        $('#closeoncloseluist').hide();
    });
    $('#sfclickclose').click(function () {
        $('#pop').hide();
        $(window).scrollTop(0);
    });



    $('#ctoclose').click(function () {
        $('#pop').hide();
    });

    $('#textfie').click(function () {
        $('.curnlist').toggle();
    });


    $("#to").click(function () {
        $("#pop").hide();
    });
    $("#from").click(function () {
        $("#pop").hide();
    });
    $("#destination").click(function () {
        $("#pop").hide();
    });
    $("#origin").click(function () {
        $("#pop").hide();
    });


    $('#unitedstates').click(function () {

        $('#currency').text('USD');

        var coCode = "USD";
        $.ajax({
            method: 'POST',
            url: 'ultimatorurl',
            data: { coCode: coCode },
            success: function (response) {
                // location.reload();
                window.location.href = "/";   // was "/xtremefares-v3/": a path from the original host
                //$('#err_cc').text(response).css('color','green');
            }
        });
    });
    $('#canada').click(function () {

        $('#currency').text('CAD');

        var coCode = "CAD";
        $.ajax({
            method: 'POST',
            url: 'ultimatorurl',
            data: { coCode: coCode },
            success: function (response) {
                //  location.reload();
                window.location.href = "/";   // was "/xtremefares-v3/": a path from the original host
                // $('#err_cc').text(response).css('color','green');
            }
        });
    });
    $('#unitedkingdome').click(function () {

        $('#currency').text('GBP');

        var coCode = "GBP";
        $.ajax({
            method: 'POST',
            url: 'ultimatorurl',
            data: { coCode: coCode },
            success: function (response) {
                // location.reload();
                window.location.href = "/";   // was "/xtremefares-v3/": a path from the original host
                //  $('#err_cc').text(response).css('color','green');
            }
        });
    });

    $('#india').click(function () {


        $('#currency').text('INR');

        var coCode = "INR";
        $.ajax({
            method: 'POST',
            url: 'ultimatorurl',
            data: { coCode: coCode },
            success: function (response) {
                //  location.reload();
                window.location.href = "/";   // was "/xtremefares-v3/": a path from the original host
                //  $('#err_cc').text(response).css('color','green');
            }
        });
    });

    $('#australia').click(function () {

        $('#currency').text('AUD');

        var coCode = "AUD";
        $.ajax({
            method: 'POST',
            url: 'ultimatorurl',
            data: { coCode: coCode },
            success: function (response) {
                // location.reload();
                window.location.href = "/";   // was "/xtremefares-v3/": a path from the original host
                // $('#err_cc').text(response).css('color','green');
            }
        });

    });





    $('#searchboxhotel').hide();
    $('#searchboxactivity').hide();

    $('#flightlink').click(function () {
        $('#flightlink').addClass('activetab');
        $('#hotellink').removeClass('activetab');
        $('#activitylink').removeClass('activetab');
        $('#searchboxhotel').hide();
        $('#searchbox').show();
        $('#searchboxactivity').hide();
    });

    $('#hotellink').click(function () {

        $('#flightlink').removeClass('activetab');
        $('#activitylink').removeClass('activetab');
        $('#hotellink').addClass('activetab');
        $('#searchboxhotel').show();
        $('#searchbox').hide();
        $('#searchboxactivity').hide();

    });

    $('#activitylink').click(function () {

        $('#flightlink').removeClass('activetab');
        $('#hotellink').removeClass('activetab');
        $('#activitylink').addClass('activetab');
        $('#searchboxactivity').show();
        $('#searchboxhotel').hide();
        $('#searchbox').hide();

    });
    if (window.matchMedia('(max-width: 600px)').matches) {
        setTimeout(fnShowPopup, 10000);
        $('#closeme').click(function () {
            $('#coverpop').fadeOut(700);
            $('#coverpop').hide();


        });
        function fnShowPopup() {
            $('#coverpop').fadeIn(700);
            $('#coverpop').css('display', 'block');

        }
    }

    $('#thepopboxopen').click(function (e) {
        e.preventDefault();
        e.stopPropagation();
        $('.flightstatusinfo').fadeToggle(500);
    });
    $('.flightstatusinfo').click(function (e) {

        e.stopPropagation();

    });
    $('body').click(function () {

        $('.flightstatusinfo').hide();

    });
    $('#sendmcontact').click(function () {

        var name = $('#name').val();
        var email = $('#email').val();
        var subject = $('#subject').val();
        var message = $('#exampleFormControlTextarea1').val();
        if (name == '' || email == '' || subject == '' || message == '') {
            $('#err_con').text('All Fields are Required');

        }
        else {

            $.ajax({
                method: 'POST',
                url: 'sendmail',
                data: { name: name, email: email, subject: subject, message: message },
                success: function (response) {

                    $('#err_con').text(response).css('color', 'green');
                }

            });


        }
    });

    $('#myfrnn').keyup(function () {
        this.value = this.value.replace(/[^0-9\.]/g, '');
    });
    $('#myphone').keyup(function () {
        this.value = this.value.replace(/[^0-9\.]/g, '');
    });
    $("#myfrnn").attr("maxlength", "10");
    $("#myphone").attr("maxlength", "10");

    $('#ajaxgrabdeal').click(function (event) {

        var name = $('#myfrn').val();
        var num = $('#hashv').val();

        var phone = $('#myfrnn').val();
        var orgi = $('#origin_80').val();
        var desti = $('#destination_80').val();
        var currenturi = '/' + window.location.pathname;
        if (name == '' || phone == '') {
            $('#err_gd').text('All Fields are Required');

        }

        else {

            $.ajax({
                method: 'POST',
                url: 'thankyouuser',
                data: { name: name, phone: phone, currenturi: currenturi, orgi: orgi, desti: desti, num: num },
                success: function (response) {

                    $('#err_gd').text(response).css('color', 'green');
                }

            });


        }
        event.preventDefault();
        event.stopPropagation();
    });
    $('#ajaxcoupon').click(function (event) {

        var countryCode = $('#exampleFormControlSelect1').val();
        var phone = $('#myphone').val();
        var number = $('#hashv2').val();
        var currenturi = '/' + window.location.pathname;
        if (countryCode == '' || phone == '') {
            $('#err_cc').text('All Fields are Required');

        }

        else {

            $.ajax({
                method: 'POST',
                url: 'couponthanks',
                data: { countryCode: countryCode, phone: phone, currenturi: currenturi, number: number },
                success: function (response) {

                    $('#err_cc').text(response).css('color', 'green');
                }

            });


        }
        event.preventDefault();
        event.stopPropagation();
    });
    $(".frn").on('click', '#origin2', function () {
        $('#cookyGotItBtnBox').hide();
        //console.log('hello');

        $('.listsearchlist').show();
        $('#origin').focus();
    });
    $(".frn").on('click', '#destination2', function () {

        //alert('hello');
        //console.log('hello');


        $('.listsearchlistdes').show();

        $('#destination').focus();
        return false;
    });
    $('#check2').click(function () {
        $('.listsearchlistdes').show();
        $('#destination').focus();
        return false;
    });

    $(".frn").on('keyup', '#origin2', function () {
        // alert('hello');

        //  e.preventDefault();

        if (this.value.length < 3) return;
        // alert(this.value);
        $('.mobileorigin').val(this.value);
        var inpval2 = this.value;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            beforeSend: function (msg) {

                $('.spinorg').show(500);
                //$(".tttt").show();

            },
            success: function (response) {



                $("#mysearchlist").html("");
                //console.log(response);


                const data = JSON.parse(response);
                // console.log(data.error);
                var counter = 0;
                if (!$.trim(data.error)) {

                }
                else {
                    //    $("#mysearchlist").prepend("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose1()' class='fa-solid fa-xmark'></i> From Where?</h4></div>"); 
                    //   $('#mysearchlist').append('<input type="text" id="origin" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;"  class="form-control mobileorigin" value='+inpval2+'   placeholder="FROM" autocomplete="off" >');



                    $('#mysearchlist').append('<li class="myidclas">' + data.error + '</li>');
                    //  $('.spinorg').hide();

                    //alert('hello');

                }

                // console.log(response);
                $.each(data.record, function (index, value) {
                    if (index === 0) {
                        //     $("#mysearchlist").prepend("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose1()' class='fa-solid fa-xmark'></i> From Where?</h4></div>"); 
                        //  $('#mysearchlist').append('<div class="posrel" style="position:relative;"><i class="fa-sharp fa-solid fa-circle-xmark " id="blankoriginmobile" style="cursor:pointer;position: absolute;top: 10px;right: 2px;"  style="cursor:pointer;"></i><input type="text" id="origin" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;" class="form-control mobileorigin" value='+inpval2+'  placeholder="FROM" autocomplete="off"></div>');

                        // if(inpval2.length > 3){
                        //   $('#mysearchlist').append('<li class="myidclas  " ><img src="/assets/image/plane-icon.png" style="width:15px;"> <strong>'+value.cityCode+'-</strong>'+value.cityname+' All AirPorts,' +value.cityname+','+value.countryname+ '</li>');

                        //}else{
                        $('#mysearchlist').append('<li class="myidclas "  id="listna_' + index + '"><img src="/assets/image/plane-icon.png" style="width: 18px;position: relative;left: -5px;"> <strong class="check56">' + value.cityCode + '-</strong>' + value.cityname + ' All AirPorts</li><input type="hidden" value="' + value.cityCode + '" class="listclass" id="check_' + index + '" />');

                        // }
                    }
                    var index = index + 1;
                    let flag = value.countrycode.toLowerCase();

                    // console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;"class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlist").append('<li class="myidclas" style=" padding: 10px 3px 10px 18px;" id="listna_' + index + '"><i class="fas fa-level-up-alt fa-rotate-90"></i> <b style="text-transform: capitalize;font-size: 12px; font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname.toLowerCase() + '  - ' + value.code + '</b>' + '<br/><span style="margin-left: 11px;font-size:13px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div> <input type="hidden" value="' + value.code + '" class="listclass" id="check_' + index + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="check2_' + index + '" /> </li>');
                    counter = index;
                    // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                });

                $.each(data.record2, function (index, value) {
                    //console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlist").append('<li class="myidclas" id="listna_' + (counter + 1) + '"><img style="position: relative;top: 2px;left: -7px; width:12px;" src="/assets/image/plane-icon.png"> <b style="font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + '  - ' + value.code + '</b>' + '<br/><span style="margin-left:16px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div><input type="hidden" value="' + value.code + '" class="listclass" id="check_' + (counter + 1) + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="check2_' + (counter + 1) + '" /></li>');               // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                    counter++;
                });

                //$("#mysearchlist").fadeIn(1000);

                // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> [value.code'"] <b>'. $sub['cityName'] .' ('. $sub['name'] .') </b><br/><span style="margin-left: 26px;">'.$sub['cityName'].', '.$sub['countryName'].'</span></a></li>');



                // $(".tttt").hide();
                $("#mysearchlist").show();
                $(".spinorg").hide();

                $(".listsearchlist").show();

            }
        });


    });

    $(".frn").on('keyup', '#origin2', function (e) {

        var y = $('#origin2').val();
        if (y == '') {
            $('#check1').html('Origin Airport');
            $('#blank1').hide();
        }

    });
    $(".frn").on('keyup', '#destination2', function (e) {


        var y = $('#destination2').val();
        if (y == '') {
            $('#check2').html('Destination Airport');
            $('#blank2').hide();
        }

    });

    $(".frn").on('keyup', '#origin', function (e) {

        var delay = 2000;

        if (this.value.length < 3) return;

        //alert(this.value);
        var inpval = this.value;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            beforeSend: function (msg) {

                // $('.spinorg').show(500);
                // $("#mysearchlist").html("");
                $('#mysearchlist li').remove();
                $('#mysearchlist').append('<div class="d-flex justify-content-center"><div class="spinner-border text-dark tttt" style="margin-top:20px;" role="status"><span class="sr-only">Loading...</span></div></div>');
            },
            success: function (response) {



                $("#mysearchlist").html("");
                // alert(response);


                const data = JSON.parse(response);
                // console.log(data.error);
                var counter = 0;
                if (!$.trim(data.error)) {

                }
                else {

                    //  $("#mysearchlist").prepend("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose1()' class='fa-solid fa-xmark'></i> From Where?</h4></div>"); 
                    //  $('#mysearchlist').append('<input type="text" id="origin" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;" class="form-control mobileorigin" value='+inpval+'  placeholder="FROM" autocomplete="off" >');
                    $('#mysearchlist').append('<li class="myidclas">' + data.error + '</li>');

                }

                // console.log(response);
                $.each(data.record, function (index, value) {
                    if (index === 0) {

                        //$("#mysearchlist").prepend("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose1()' class='fa-solid fa-xmark'></i> From Where?</h4></div>");  





                        //   if(inpval.length > 3){
                        //        $('#mysearchlist').append('<li class="myidclas"><img src="/assets/image/plane-icon.png" style="width:15px;"> <strong>'+inpval+'-</strong>'+value.cityname+' All AirPorts,' +value.cityname+','+value.countryname+ '</li>');

                        //   }else{
                        $('#mysearchlist').append('<li class="myidclas" id="listna_' + index + '"><img src="/assets/image/plane-icon.png" style="width: 18px;position: relative;left: -5px;"> <strong class="check56">' + value.cityCode + '-</strong>' + value.cityname + ' All AirPorts</li><input type="hidden" value="' + value.cityCode + '" class="listclass" id="check_' + index + '" />');

                        //   }
                    }
                    var index = index + 1;
                    let flag = value.countrycode.toLowerCase();

                    // console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;"class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlist").append('<li class="myidclas" style="padding: 8px 3px 8px 30px;" id="listna_' + index + '"><i class="fas fa-level-up-alt fa-rotate-90"></i> <b style="text-transform: capitalize;font-size: 12px; font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + ' </b> (' + value.code + ')' + '<br/><span style="margin-left: 11px;font-size:12px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div> <input type="hidden" value="' + value.code + '" class="listclass" id="check_' + index + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="check2_' + index + '" /> </li>');
                    counter = index;
                    // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                });

                $.each(data.record2, function (index, value) {
                    //console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlist").append('<li style="margin: 0 0 0 -5px;" class="myidclas" id="listna_' + (counter + 1) + '"><img style="position: relative;top: 0px;left: -3px; width:12px;" src="/assets/image/plane-icon.png"> <b style="text-transform: capitalize;font-size: 12px; font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + ' </b> (' + value.code + ')' + '<br/><span style="margin-left: 15px;font-size:12px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div><input type="hidden" value="' + value.code + '" class="listclass" id="check_' + (counter + 1) + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="check2_' + (counter + 1) + '" /></li>');               // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                    counter++;
                });

                //$("#mysearchlist").fadeIn(1000);

                // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> [value.code'"] <b>'. $sub['cityName'] .' ('. $sub['name'] .') </b><br/><span style="margin-left: 26px;">'.$sub['cityName'].', '.$sub['countryName'].'</span></a></li>');



                $("#mysearchlist").show();
                $('.spinorg').hide();


            }
        });


    });







    $(".frn").on('keyup', '#origin_80', function () {



        //if( this.value.length < 3 ) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {

                $("#mysearchlist_80").fadeIn(1000);

                $("#mysearchlist_80").html(response);


            }

        });


    });


    $(".frn").on('keyup', '#originmul', function (e) {

        e.preventDefault();

        if (this.value.length < 3) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {

                $("#mysearchlistmul").fadeIn(1000);

                $("#mysearchlistmul").html(response);


            }

        });


    });



    // $(document).on('keyup','#originmuld',function(){


    //    if( this.value.length < 3 ) return;
    // $.ajax({

    //     method: 'POST',
    //     url: 'flightname',
    //     data: { name: $(this).val() },
    //     success: function(response){

    //     //     $('.appendform').find("#mysearchlistmuld").fadeIn(1000);

    //           $('#frnd').find("#mysearchlistmuld").html(response);

    //     }

    // });


    // });



    $(document).on('keyup', '.ori', function () {
        var id = $(this).attr('id');
        var splitid = id.split('_');
        var index = splitid[1];

        //if( this.value.length < 3 ) return;
        $.ajax({

            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {

                //     $('.appendform').find("#mysearchlistmuld").fadeIn(1000);

                $("#mysearchlistmuld_" + index).html(response);

            }

        });
        return false;
    });

    $(document).on('keyup', '.des', function () {
        var id = $(this).attr('id');
        var splitid = id.split('_');
        var index = splitid[1];

        //if( this.value.length < 3 ) return;
        $.ajax({

            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {

                //     $('.appendform').find("#mysearchlistmuld").fadeIn(1000);

                $("#mysearchlistdestinationmuld_" + index).html(response);

            }

        });
        return false;
    });

    $(document).on("click", ".oriclass", function (e) {
        e.preventDefault();
        var id = $(this).attr('id');
        var splitid = id.split('_');
        var index = splitid[1];
        $("#originmuld_" + index).val($(this).text());
        $("#destinationmuld").focus();
        $('#mysearchlistmuld_' + index).hide();
        $('#mysearchlistmuld_' + index).fadeOut(1000);
    });

    $(document).on("click", ".desclass", function (e) {
        e.preventDefault();
        var id = $(this).attr('id');
        var splitid = id.split('_');
        var index = splitid[1];
        $("#destinationmuld_" + index).val($(this).text());
        $("#mysearchlistdestinationmuld_" + index).hide();
        $("#mysearchlistdestinationmuld_" + index).fadeOut(1000);
        // $("#from").focus();
    });

    // $('.oriclass').on("click", "li", function(e) {
    //   e.preventDefault();
    //   var id= $(this).attr('id');
    //   alert(id);
    //  $("#originmuld_"+index).val($(this).text());
    //  $("#destinationmuld").focus();

    //  $('#mysearchlistmuld').hide();
    //  $('#mysearchlistmuld').fadeOut(1000);
    // });

    $("#originhotel").keyup(function () {

        //if( this.value.length < 3 ) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {
                $("#mysearchlisthotel").fadeIn(100);

                $("#mysearchlisthotel").html(response);


            }

        });


    });


    // Add minus icon for collapse element which is open by default

    $('#ajaxcpop').click(function () {

        var phone = $('#phone').val();
        var orgi = $('#orgi').val();
        var des = $('#des').val();
        var ddep = $('#ddep').val();
        var dretu = $('#dretu').val();
        var tytoe = $('#tytoe').val();


        if (phone == '') {
            $("#succcess").html("Phone number is required!");
        }
        else {
            $.ajax({
                method: 'POST',
                url: 'quickcallrequest',
                data: { phone: phone, orgi: orgi, des: des, ddep: ddep, dretu: dretu, tytoe: tytoe },
                success: function (response) {
                    $('.btn-group-vertical').css('display', 'none');
                    $("#succcess").html(response);

                }

            });
        }
    });







    $('#mysearchlist').on("click", "li", function (e) {

        e.preventDefault();



        var id = $(this).attr('id');


        // alert(id);
        var test = id.split("_");
        //   uyjhghg

        var code = $("#check_" + test[1]).val();
        var code2 = $("#check2_" + test[1]).val();
        // alert(code);
        if (id == 'listna_0') {
            $('#check1').html("All AirPorts");
            $('.from_air').val("All AirPorts");
            $(".origin_value").val(code);
            $('#mysearchlist').hide();
            $('.spinorg').hide();
            $('.listsearchlist').fadeOut(1000);
            return false;
        }
        $(".origin_value").val(code);
        var str = $(this).text();
        var test = str.match(/(.+)\.(.+)/);
        $('#check1').html(code2);
        $('.from_air').val(code2);

        $('#blank1').show();

        $('.listsearchlist').hide();
        $('.spinorg').hide();
        $('.listsearchlist').fadeOut(1000);

        // $("#destination2").focus();

    });





    //   $('#mysearchlist').on("click", "li", function(e) {

    //     e.preventDefault();



    //   var id    =$(this).attr('id');
    //   var test = id.split("_");

    //     var code =$("#check_"+test[1]). val();
    //     var code2 =$("#check2_"+test[1]). val();
    //    // alert(code);

    //     $(".origin_value").val(code);
    //       $("#destination").focus();
    //     var str = $(this).text();
    //      var test = str.match(/(.+)\.(.+)/);
    //     $('#check1').html(code2);

    //     $('#blank1').show();

    //     $('#mysearchlist').hide();
    //     $('.spinorg').hide();
    //     $('#mysearchlist').fadeOut(1000);
    //   });


    $('#mysearchlist_80').on("click", "li", function (e) {
        e.preventDefault();
        $("#origin_80").val($(this).text());
        $("#destination_80").focus();

        $('#mysearchlist_80').hide();
        $('#mysearchlist_80').fadeOut(1000);
    });
    $('#mysearchlistmul').on("click", "li", function (e) {
        e.preventDefault();
        $("#originmul").val($(this).text());
        $("#destinationmul").focus();

        $('#mysearchlistmul').hide();
        $('#mysearchlistmul').fadeOut(1000);
    });



    $('#mysearchlisthotel').on("click", "li", function (e) {
        e.preventDefault();
        $("#originhotel").val($(this).text());
        $("#checkin").focus();

        $('#mysearchlisthotel').hide();
        $('#mysearchlisthotel').fadeOut(1000);
    });

    $('#originhotel').blur(function () {
        if (!$(this).val()) {
            $('#mysearchlisthotel').hide();
        }
    });

    $('#origin').blur(function () {
        if (!$(this).val()) {
            $('#mysearchlist').hide();
        }
    });



    $("#prefred").keyup(function () {



        var pair = $(this).val();
        if (this.value.length < 2) return;
        $.ajax({
            method: 'POST',
            url: 'preferairline',
            data: { name: $(this).val() },
            success: function (response) {
                $("#pair").fadeIn(1000);

                $("#pair").html(response);



            }
        });
    });

    $('#prefferedairline').blur(function () {
        if (!$(this).val()) {
            $('#pair').hide();
        }
    });

    $('#pair').on("click", "li", function (e) {
        e.preventDefault();
        $("#prefred").val($(this).text());
        $('#pair').hide();
        $('#pair').fadeOut(1000);
    });

    //  $("#destination").keyup(function(){

    $(".frn").on('keyup', '#destination2', function () {


        if (this.value.length < 3) return;
        var destinationval = this.value;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            beforeSend: function (msg) {

                $('.spindest').show(500);
            },
            success: function (response) {

                $("#mysearchlistdestination").html("");
                // alert(response);

                //  console.log(response);
                const data = JSON.parse(response);
                if (!$.trim(data.error)) {

                }
                else {
                    //$("#mysearchlistdestination").append("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose2()' class='fa-solid fa-xmark'></i> Where To?</h4></div>");
                    // $('#mysearchlistdestination').append('<input type="text" class="form-control mobiledestination" value="'+destinationval+'" id="destination" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;"  placeholder="TO" autocomplete="off">');
                    $('#mysearchlistdestination').append('<li class="myidclas">' + data.error + '</li>');
                }
                var counter = 0;
                $.each(data.record, function (index, value) {
                    if (index === 0) {

                        //   $("#mysearchlistdestination").append("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose2()' class='fa-solid fa-xmark'></i> Where To?</h4></div>");
                        //     $('#mysearchlistdestination').append('<input type="text" class="form-control mobiledestination" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;"  value='+destinationval+' id="destination"  placeholder="TO" autocomplete="off">');



                        var destination_count = $('#destination2').val();
                        // if(destination_count.length > 3){
                        //     $('#mysearchlistdestination').append('<li class="myidclas"><img src="/assets/image/plane-icon.png" style="width:15px;"> <strong>'+destinationval+'-</strong>'+value.cityname+' All AirPorts,' +value.cityname+','+value.countryname+ '</li>');

                        //  }else{
                        $('#mysearchlistdestination').append('<li class="myidclas" id="listna_' + index + '"><img src="/assets/image/plane-icon.png" style="width: 18px;position: relative;left: -5px;"> <strong class="check56">' + value.cityCode + '-</strong>' + value.cityname + ' All AirPorts</li><input type="hidden" value="' + value.cityCode + '" class="listclass" id="checkr_' + index + '" />');

                        //  }

                    }

                    // console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    var index = index + 1;
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;"class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlistdestination").append('<li class="myidclas" style="padding: 10px 3px 10px 18px;" id="listna_' + index + '"><i class="fas fa-level-up-alt fa-rotate-90"></i><b style="font-weight:500;">' + value.cityname + '  ,  ' + value.countryname + ' </b> (' + value.code + ')' + '<br/><span style="margin-left:22px; color:#717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div> <input type="hidden" value="' + value.code + '" class="listclass" id="checkr_' + index + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="checkr2_' + index + '" /> </li>');
                    counter = index;
                    // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                });

                $.each(data.record2, function (index, value) {
                    //console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlistdestination").append('<li style="margin: 0 0 0 -5px;" class="myidclas" id="listna_' + (counter + 1) + '"><img style="position: relative;top: 2px;left: -7px; width:12px;" src="/assets/image/plane-icon.png"> <b style="font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + '</b>  (' + value.code + ')' + '<br/><span style="margin-left:22px; color:#717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div><input type="hidden" value="' + value.code + '" class="listclass" id="checkr_' + (counter + 1) + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="checkr2_' + (counter + 1) + '" /></li>');               // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                    counter++;
                });

                //$("#mysearchlist").fadeIn(1000);

                // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> [value.code'"] <b>'. $sub['cityName'] .' ('. $sub['name'] .') </b><br/><span style="margin-left: 26px;">'.$sub['cityName'].', '.$sub['countryName'].'</span></a></li>');
                $(".spindest").hide();
                $("#mysearchlistdestination").show();
                $(".listsearchlistdes").show();





                //$("#mysearchlistdestination").fadeIn(1000);

                //  $("#mysearchlistdestination").html(response);



            }

        });


    });
    $(".frn").on('keyup', '#destination', function () {
        //alert('hejh');
        var delay = 2000;
        var term = $(this).val();
        if (this.value.length < 3) return;
        var destinationvalue = this.value;
        // var inpval=this.value;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            beforeSend: function (msg) {

                $('.spindest').show(500);
                $('#mysearchlistdestination li').remove();
                $('#mysearchlistdestination').append('<div class="d-flex justify-content-center"><div class="spinner-border text-dark pppp" style="margin-top:20px;" role="status"><span class="sr-only">Loading...</span></div></div>');

            },
            success: function (response) {


                $("#mysearchlistdestination").html("");
                // alert(response);

                //  console.log(response);
                const data = JSON.parse(response);
                if (!$.trim(data.error)) {

                }
                else {
                    // $("#mysearchlistdestination").append("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose2()' class='fa-solid fa-xmark'></i> Where To?</h4></div>");
                    // $('#mysearchlistdestination').append('<input type="text" class="form-control mobiledestination" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;" value='+destinationvalue+' id="destination"  placeholder="TO" autocomplete="off">');
                    $('#mysearchlistdestination').append('<li class="myidclas">' + data.error + '</li>');
                }
                var counter = 0;
                $.each(data.record, function (index, value) {
                    if (index === 0) {

                        //  $("#mysearchlistdestination").append("<div class='deporg'><h4><i id='depclickclose' onclick='dpclose2()' class='fa-solid fa-xmark'></i> Where To?</h4></div>");
                        // $('#mysearchlistdestination').append('<input type="text" class="form-control mobiledestination" style="border: 1px solid #ccc !important;margin-bottom: 3px; margin-top: 16px;    width: 104%;" value='+destinationvalue+' id="destination"  placeholder="TO" autocomplete="off">');

                        // $('#mysearchlistdestination').append('<li class="myidclas" id="listna_'+index+'"><img src="/assets/image/plane-icon.png" style="width: 18px;position: relative;left: -5px;"> <strong class="check56">'+value.code+'-</strong>'+value.cityname+' All AirPorts</li><input type="hidden" value="'+value.code+'" class="listclass" id="checkr_'+index+'" />');
                        var destination_count = $('#destination').val();
                        // alert(destination_count.length);
                        //   if(destination_count.length > 3){
                        //       $('#mysearchlistdestination').append('<li class="myidclas"><img src="/assets/image/plane-icon.png" style="width:15px;"> <strong>'+destinationvalue+'-</strong>'+value.cityname+' All AirPorts,' +value.cityname+','+value.countryname+ '</li>');

                        //    }else{
                        $('#mysearchlistdestination').append('<li class="myidclas" id="listna_' + index + '"><img src="/assets/image/plane-icon.png" style="width: 18px;position: relative;left: -5px;"> <strong class="check56">' + value.cityCode + '-</strong>' + value.cityname + ' All AirPorts</li><input type="hidden" value="' + value.cityCode + '" class="listclass" id="checkr_' + index + '" />');

                        //   }
                    }

                    // console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    var index = index + 1;
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;"class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlistdestination").append('<li class="myidclas" style="padding: 8px 3px 8px 30px;" id="listna_' + index + '"><i class="fas fa-level-up-alt fa-rotate-90"></i><b style="text-transform: capitalize;font-size: 12px; font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + ' </b> (' + value.code + ')' + '<br/><span style="margin-left: 16px;font-size:12px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div> <input type="hidden" value="' + value.code + '" class="listclass" id="checkr_' + index + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="checkr2_' + index + '" /> </li>');
                    counter = index;
                    // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                });

                $.each(data.record2, function (index, value) {
                    //console.log( index + ": " + value.code );
                    // $("#mysearchlist").append("<li>"+ value.code + "</li>");
                    let flag = value.countrycode.toLowerCase();

                    // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> ['+value.code+"] <b>'" +value.cityname+ ' (' +value.name+') </b><br/><span style="margin-left: 26px;">'+value.cityname+', '+value.cityname+'</span></a></li>');
                    $("#mysearchlistdestination").append('<li style="margin: 0 0 0 -5px;" class="myidclas" id="listna_' + (counter + 1) + '"><img style="position: relative;top: 0px;left: -3px; width:12px;" src="/assets/image/plane-icon.png"> <b style="text-transform: capitalize;font-size: 12px; font-weight:500; color: #3a3a3a;">' + value.cityname + '  ,  ' + value.countryname + '</b>  (' + value.code + ')' + '<br/><span style="margin-left: 16px;font-size:12px; color: #717171;">' + value.name + '</span><div style="margin-top: -9px;float: right;"><img src="/assets/flag/' + flag + '.png"></div><input type="hidden" value="' + value.code + '" class="listclass" id="checkr_' + (counter + 1) + '" /><input type="hidden" value="' + value.countryname + ' , ' + value.cityname + '" class="listclass" id="checkr2_' + (counter + 1) + '" /></li>');               // $('#content ul').append(
                    //     $('<li>').append(
                    //         $('<a>').attr('href','/user/messages').append(
                    //             $('<span>').attr('class', 'tab').append("Message center")
                    // )));
                    counter++;
                });

                //$("#mysearchlist").fadeIn(1000);

                // $("#mysearchlist").append('<li class="myidclas" id="myid"><i style="transform: rotate(90deg) translateY(-100%);transform-origin:top left; padding: 7px 5px 4px 9px;" class="fas fa-level-up-alt"> </i><a href=""> [value.code'"] <b>'. $sub['cityName'] .' ('. $sub['name'] .') </b><br/><span style="margin-left: 26px;">'.$sub['cityName'].', '.$sub['countryName'].'</span></a></li>');

                $("#mysearchlistdestination").show();
                $('.spindest').hide();




                //$("#mysearchlistdestination").fadeIn(1000);

                //  $("#mysearchlistdestination").html(response);



            }

        });


    });
    $("#destination_80").keyup(function () {
        var term = $(this).val();
        if (this.value.length < 3) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {
                $("#mysearchlistdestination_80").fadeIn(1000);

                $("#mysearchlistdestination_80").html(response);



            }

        });


    });
    $(".frn").on('keyup', '#destinationmul', function () {


        var term = $(this).val();
        if (this.value.length < 3) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {
                $("#mysearchlistdestinationmul").fadeIn(1000);

                $("#mysearchlistdestinationmul").html(response);



            }

        });


    });

    $(".frn").on('keyup', '#destinationmuld', function () {


        var term = $(this).val();
        if (this.value.length < 3) return;
        $.ajax({
            method: 'POST',
            url: 'flightname',
            data: { name: $(this).val() },
            success: function (response) {
                $("#mysearchlistdestinationmuld").fadeIn(1000);

                $("#mysearchlistdestinationmuld").html(response);



            }

        });


    });


    $('#mysearchlistdestination').on("click", "li", function (e) {
        e.preventDefault();


        var id = $(this).attr('id');

        var test = id.split("_");

        var code = $("#checkr_" + test[1]).val();
        var code2 = $("#checkr2_" + test[1]).val();
        //  alert(code);

        if (id == 'listna_0') {
            $('#check2').html("All AirPorts");
            $('.dest_air').val("All AirPorts");
            $(".destination_value").val(code);
            $('.listsearchlistdes').hide();
            $('.spindest').hide();
            $('.listsearchlistdes').fadeOut(1000);
            return false;
        }

        $(".destination_value").val(code);

        // var str = $(this).text();
        // var test = str.match(/(.+)\.(.+)/);
        $('#check2').html(code2);
        $('.dest_air').val(code2);
        //$("#destination").focus();



        //  $("#destination").val($(this).text());
        $('.listsearchlistdes').hide();
        $('.spindest').hide();
        $('.listsearchlistdes').fadeOut(1000);
        $('#blank2').show();
        $("#from").focus();
    });
    $('#mysearchlistdestination_80').on("click", "li", function (e) {
        e.preventDefault();
        $("#destination_80").val($(this).text());
        $('#mysearchlistdestination_80').hide();
        $('#mysearchlistdestination_80').fadeOut(1000);
        // $("#from").focus();
    });


    $('#mysearchlistdestinationmul').on("click", "li", function (e) {

        e.preventDefault();

        $("#destinationmul").val($(this).text());
        $('#mysearchlistdestinationmul').hide();
        $('#mysearchlistdestinationmul').fadeOut(1000);
        $("#from").focus();
    });

    $('.desclass').on("click", ".myidclas", function (e) {
        e.preventDefault();
        var id = $(this).attr('id');
        alert("Working fine " + id);
        var splitid = id.split('_');
        var index = splitid[1];
        $("#destinationmuld_" + index).val($('#myid_' + index).text());
        $('#mysearchlistdestinationmuld_' + index).hide();
        $('#mysearchlistdestinationmuld' + index).fadeOut(1000);
        $("#from").focus();
    });





    // $("#to").change(function(){
    //     $("#pop").toggle(500);
    // });

    $('#destination2').blur(function () {
        $('#cookyGotItBtnBox').hide();
        if (!$(this).val()) {
            $('#mysearchlistdestination').hide();
        }
    });



    $("#popover_new").click(function () {

        $("#pop_new").toggle(500);

    });




    $('.plus_room').click(function () {

        $('.room').html(function (i, val) {
            if (val <= 9) {
                return val * 1 + 1
            }
        });
        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
        $('#room').val(inf);

    });
    $('.minus_room').click(function () {


        $('.room').html(function (i, val) {
            if (val > 1) {


                return val * 1 - 1
            }
        });

        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();
        var radioValue = $("input[name='type']:checked").val();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });


    var ad = $('.adult').text();
    var ch = $('.child').text();
    var inf = $('.infant').text();
    var radioValue = $("#class_type").val();
    var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
    $("#popover").val(totaltravlers + ' Traveller');



    $('.plus_adult').click(function () {
        // alert('hemant');


        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        var totaltravlers = parseInt(ad) + parseInt(ch);

        if (totaltravlers < 9) {
            $('.adult').html(function (i, val) {

                if (val <= 10) {
                    return val * 1 + 1
                }
            });
            $('.adultop').html(function (i, val) {

                if (val <= 10) {
                    return val * 1 + 1
                }
            });
            //if(radioValue){
            var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf) + 1;
            $("#popover").val(totaltravlers + ' Traveller');
            //   }

            $('#adult').val($('.adult').text());
            $('#child').val($('.child').text());
            $('#infant').val($('.infant').text());

        }

    });

    $('.plus_adultt').click(function () {

        $('.adultt').html(function (i, val) {
            if (val <= 9) {
                return val * 1 + 1
            }
        });
        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });
    $('.minus_adultt').click(function () {


        $('.adultt').html(function (i, val) {
            if (val > 1) {


                return val * 1 - 1
            }
        });

        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });

    $('.minus_adult').click(function () {


        $('.adult').html(function (i, val) {
            if (val > 1) {


                return val * 1 - 1
            }
        });
        $('.adultop').html(function (i, val) {
            if (val > 1) {


                return val * 1 - 1
            }
        });

        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        if (radioValue) {
            var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
            $("#popover").val(totaltravlers + ' Traveller');
        }
        $('#adult').val($('.adult').text());
        $('#child').val($('.child').text());
        $('#infant').val($('.infant').text());
    });



    $('.plus_child').click(function () {



        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        var totaltravlers = parseInt(ad) + parseInt(ch);
        if (totaltravlers < 9) {
            $('.child').html(function (i, val) {
                if (val >= 10) {
                }
                else {
                    return val * 1 + 1
                }
            });
            $('.childpop').html(function (i, val) {
                if (val >= 10) {
                }
                else {
                    return val * 1 + 1
                }
            });
            // if(radioValue){
            var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf) + 1;
            $("#popover").val(totaltravlers + ' Traveller');
            //  }
            $('#adult').val($('.adult').text());
            $('#child').val($('.child').text());
            $('#infant').val($('.infant').text());
        }
    });



    $('.plus_childt').click(function () {


        $('.childt').html(function (i, val) {
            if (val >= 9) {
            }
            else {
                return val * 1 + 1
            }
        });
        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });
    $('.minus_childt').click(function () {

        $('.childt').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });


    $('.minus_child').click(function () {

        $('.child').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        $('.childpop').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        if (radioValue) {
            var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
            $("#popover").val(totaltravlers + ' Traveller');
        }
        $('#adult').val($('.adult').text());
        $('#child').val($('.child').text());
        $('#infant').val($('.infant').text());
    });


    $('.plus_infant').click(function () {



        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        // var totaltravlers= parseInt(ad)+parseInt(ch)+parseInt(inf);
        // if(totaltravlers < 9){
        $('.infant').html(function (i, val) {
            if (val >= ad) {
            }
            else {
                return val * 1 + 1
            }
        });
        $('.infantpop').html(function (i, val) {
            if (val >= ad) {
            }
            else {
                return val * 1 + 1
            }
        });
        // if(radioValue){
        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf) + 1;
        $("#popover").val(totaltravlers + ' Traveller');
        // }
        $('#adult').val($('.adult').text());
        $('#child').val($('.child').text());
        $('#infant').val($('.infant').text());
        // }
    });


    $('.plus_infantt').click(function () {

        $('.infantt').html(function (i, val) {
            if (val >= 9) {
            }
            else {
                return val * 1 + 1
            }
        });

        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });


    $('.minus_infantt').click(function () {

        $('.infantt').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        var ad = $('.adultt').text();
        var ch = $('.childt').text();
        var inf = $('.infantt').text();
        var room = $('.room').text();

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        $("#popover_new").val(totaltravlers + ' Traveller' + ', Room:' + room);

        $('#room').val(inf);
        $('#adultt').val(ad);
        $('#childt').val(ch);
        $('#infantt').val(inf);
    });


    $('.minus_infant').click(function () {

        $('.infant').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        $('.infantpop').html(function (i, val) {
            if (val <= 0) {
            }
            else {
                return val * 1 - 1
            }
        });
        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();
        var radioValue = $("input[name='type']:checked").val();
        if (radioValue) {
            var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
            $("#popover").val(totaltravlers + ' Traveller');
        }
        $('#adult').val($('.adult').text());
        $('#child').val($('.child').text());
        $('#infant').val($('.infant').text());
    });

    $(".class").click(function () {

        var ad = $('.adult').text();
        var ch = $('.child').text();
        var inf = $('.infant').text();

        $('#adult').val(ad);
        $('#child').val(ch);
        $('#infant').val(inf);

        var totaltravlers = parseInt(ad) + parseInt(ch) + parseInt(inf);
        var radioValue = $("input[name='type']:checked").val();
        if (radioValue) {

            $("#popover").val(totaltravlers + ' Traveller');
            $("#class_type").val(radioValue);
        }
    });



    $(document).on("click", ".origin_focus", function () {

        $('#origin').focus();
    });
    $(document).on("click", ".destination_focus", function () {

        $('#destination').focus();
    });

    $(document).on("click", ".dp_date_focus", function () {

        $('#from').focus();
    });
    $(document).on("click", ".ar_date_focus", function () {
        $('#to').focus();
    });
    $(document).on("click", ".traveller_focus", function () {
        //alert('hello');

        $('#pop').toggle(500);

    });


    $('.themultiform').hide();

    $('#to').prop("disabled", false);
    $('#round').click(function () {
        // alert('hello');
        $(".search-smallinput").css("width", "20.5%");
        $('#ar_date_focus').show();
        $("select[name='title13']:eq(0)").val('round');
        $('#triptype').val('round');
        $('#oneway').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#round').addClass('ulvactive');
        $('#to').prop("disabled", false);
        $('.mainfrm').show();
        $('.themultiform').hide();
        $('.arclpop').show();
        $("#ar_date_focus").addClass('ar_date_focus');
    });
    $('.myroudtxt').click(function () {
        $("#round").prop("checked", true);
        $("#oneway").prop("checked", false);
        $('#triptype').val('round');
        $('#oneway').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#round').addClass('ulvactive');
        $('#to').prop("disabled", false);
        $('.mainfrm').show();
        $('.themultiform').hide();
        $("#ar_date_focus").addClass('ar_date_focus');
    });

    if ($('#triptype').val() == 'round') {
        $('#oneway').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#round').addClass('ulvactive');
        $('#to').prop("disabled", false);
    } else {
        $('#round').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#oneway').addClass('ulvactive');
    }

    if ($('#class_type').val() == "Business") {

        $("#busi").attr('checked', 'checked');
        $(".class_type_name").html("Business");

    }
    if ($('#class_type').val() == "Economy") {

        $("#eco").attr('checked', 'checked');
        $(".class_type_name").html("Economy");

    }

    if ($('#class_type').val() == "Premium Economy") {

        $("#preeco").attr('checked', 'checked');
        $(".class_type_name").html("Premium Economy");
    }

    if ($('#class_type').val() == "First") {

        $("#first").attr('checked', 'checked');
        $(".class_type_name").html("First");
    }


    $('#multi').click(function () {
        $('#triptype').val('multi');
        $('#oneway').removeClass('ulvactive');
        $('#round').removeClass('ulvactive');
        $('#multi').addClass('ulvactive');
        $('#to').prop("disabled", true);
        $('.mainfrm').hide();
        $('.themultiform').show();
    });
    var rowNum = 1;
    $('#addmulticityform').click(function (e) {
        e.preventDefault();
        rowNum++;
        if (rowNum < 5) {
            var new_input = "<div class='row frn rem' id='frnd_" + rowNum + "'><div class='col-sm-3'><i class='fas fa-exchange-alt rotate' id='switcher' onclick='swap1()'></i><i class='fas fa-plane-departure' id='icodate'></i><input type='text'  name='origin[]' id='originmuld_" + rowNum + "' placeholder='Origin' class='form-control myd ori' autocomplete='off' /><ul id='mysearchlistmuld_" + rowNum + "' class='oriclass' type='cirlce'></ul></div><div class='col-sm-3'><i class='fas fa-plane-arrival' id='icodate'></i><input type='text' id='destinationmuld_" + rowNum + "' name='destination[]' placeholder='Destination' autocomplete='off' class='form-control myd des' /><ul id='mysearchlistdestinationmuld_" + rowNum + "' class='desclass' type='cirlce'></ul></div><div class='col-sm-2'><i class='far fa-calendar-alt' id='icodate'></i><input autocomplete='off' type='text' name='depart_date[]' class='form-control myd depdat' id='from_" + rowNum + "'   placeholder='Depart Date'></div><div class='col-sm-2' style='text-align:center;margin-top:7px;'><button type='button' id='remove_project_file_" + rowNum + "' class='btn btn-danger removebtn'>-</button></div></div>";
            $('.appendform').append(new_input);
        }
    });

    $(document).on('click', '.depdat', function (e) {
        e.preventDefault();
        var id = $(this).attr('id');

        $('#from_1').datepicker({
            defaultDate: "+1w",
            minDate: 0,
            numberOfMonths: 2,
        });
        $('#' + id).datepicker({
            defaultDate: "+1w",
            minDate: 0,
            numberOfMonths: 2,
        });
    });

    $(".newfunction12").change(function () {
        //alert("The text has been changed.");
        $value = $('.newfunction12').val();
        if ($value == 'round') {
            $('#round').prop('checked', true);
            $('#oneway').prop('checked', false);

        } else {
            $('#round').prop('checked', false);
            $('#oneway').prop('checked', true);
            $('#arrfield').val('');
            $('#dr_date').html('Date');
            var $dates = $('#from, #to').datepicker();
            $dates.datepicker('setDate', null);
            $('#to').hide();
            $('#from').show();
        }

    });

    $(document).mouseup(function (e) {
        if ($(e.target).closest("#mysearchlist").length
            === 0) {
            $("#mysearchlist").hide();
        }
    });

    $(document).mouseup(function (e) {
        if ($(e.target).closest("#mysearchlistdestination").length
            === 0) {
            $("#mysearchlistdestination").hide();
        }
    });
    $(document).mouseup(function (e) {
        if ($(e.target).closest("#pop").length
            === 0) {
            $("#pop").hide();
        }
    });
    $(document).mouseup(function (e) {
        if ($(e.target).closest(".desktop_view_calaender").length === 0) {
            $(".desktop_view_calaender").hide();
        }
    });
    $('#arrfield').click(function () {
        //alert('hello');

        $('.desktop_view_calaender').show();
        $("#fixcn").removeClass('show');
    });
    $('#oneway').click(function () {
        //  alert('hjh');
        $("select[name='title13']:eq(0)").val('oneway');
        $('#round').prop('checked', false);
        $('#oneway').prop('checked', true);
        $('#triptype').val('oneway');
        var $dates = $('#from, #to').datepicker();
        $dates.datepicker('setDate', null);
        $('#to').hide();
        $('#from').show();
        $('#dr_date').html('Date');
        $("#ar_date_focus").removeClass('ar_date_focus');
        $('#round').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#oneway').addClass('ulvactive');

        //  $(".to_error").css("background-colo", "#333","!important");
        $('#ar_date_focus').hide();
        $(".search-smallinput").css("width", "31%");
        $('.mainfrm').show();
        $('.arclpop').hide();
        $('#arrfield').val('');

        $('#arrfield').prop("disabled", true);

        $('.themultiform').hide();
    });


    $('.onewaytxt').click(function (e) {
        e.preventDefault();
        //alert('hjh');
        $("#round").prop("checked", false);
        $("#oneway").prop("checked", true);

        $('#triptype').val('oneway');
        $("#ar_date_focus").removeClass('ar_date_focus');
        $('#round').removeClass('ulvactive');
        $('#multi').removeClass('ulvactive');
        $('#oneway').addClass('ulvactive');
        $('.mainfrm').show();
        $('#to').val('');
        $('#to').prop("disabled", true);

        $('.themultiform').hide();
    });




    $("#c1").click(function () {
        $("#nonstop").val('true');
        if ($("#c1").prop("checked") == false) {
            $("#nonstop").val('false');
        }
    });

    // $(window).on("scroll", function() {
    //     if($(window).scrollTop() > 60) {
    //         $("header").addClass("headerclass");
    //         $("header .top-dark-nav").addClass("topactive");
    //         $("header .menu-bar").addClass("menutopactive");
    //         $("header .top-dark-nav").fadeIn(1000);
    //         $("header .menu-bar").fadeIn(1000);
    //     $(".tfncall").css("color","#000");
    //     } else {
    //         //remove the background property so it comes transparent again (defined in your css)
    //         $("header").removeClass("headerclass");
    //        $("header .top-dark-nav").removeClass("topactive");
    //        $("header .menu-bar").removeClass("menutopactive");
    //     $(".tfncall").css("color","#fff");

    //     }
    // });

    $('#stopid').click(function () {

        $('.stop').toggle(200);

    });






    $('#air').click(function () {

        $('.air').toggle(200);

    });

    $('#pri').click(function () {

        $('.pri').toggle(200);

    });

    $("#slider").slider();



    $("#paymentFrm").validate({
        rules: {
            tandc: "required",
        },
        messages: {
            tandc: ""
        },
        //    errorPlacement: function (error, element) {
        //        var name = $(element).attr("name");
        //        error.appendTo($("#" + name + "_validate"));
        //    },

    });




    $("#paymentFrm").validate({
        rules: {

            email: {
                required: true,
                email: true
            }
        },
        messages: {

            title: "required",
            gender: "required"
        }

    });

    //    $('#search22').click(function(){
    //     //alert('sejhhhj');

    //     var origin=$('#origin2').val();

    //     var destination=$('#destination2').val();

    //     var from=$('#from').val();

    //     if($('#mysearchlist').text() == 'Not Found' || $('#mysearchlistdestination').text() == 'Not Found' || origin==destination ){

    //         $('#origin').css({
    //             "border": "1px solid red",
    //         });
    //         $('#destination').css({
    //             "border": "1px solid red",
    //         });
    //          return false;
    //     }
    //     else{

    //      if(origin == '' || destination == '' || from == '')
    //      {

    //          $('#origin').css({
    //             "border": "1px solid red",
    //         });
    //         $('#destination').css({
    //             "border": "1px solid red",
    //         });
    //         $('#from').css({
    //             "border": "1px solid red",
    //         });
    //         return false;
    //      }
    //      else{

    //          return true;
    //      }
    //     }

    // });

    $('#search').click(function () {

        var origin = $('#origin').val();

        var destination = $('#destination').val();
        let trip = document.getElementsByName("triptype");
        //  alert(trip);

        var from = $('#from').val();

        if ($('#mysearchlist').text() == 'Not Found' || $('#mysearchlistdestination').text() == 'Not Found' || origin == destination) {

            $('#origin').css({
                "border": "1px solid red",
            });
            $('#destination').css({
                "border": "1px solid red",
            });
            return false;
        }
        else {

            if (origin == '' || destination == '' || from == '') {

                $('#origin').css({
                    "border": "1px solid red",
                });
                $('#destination').css({
                    "border": "1px solid red",
                });
                $('#from').css({
                    "border": "1px solid red",
                });
                return false;
            }
            else {

                return true;
            }



        }



    });


    $('#search22').click(function () {
        //alert('hello');

        var origin = $('#origin2').val();

        var destination = $('#destination2').val();
        var from = $('#depfield').val();
        var to = $('#arrfield').val();
        var txt_orgval = $('#check1').html();
        var txt_destval = $('#check2').html();

        // let trip = document.getElementsByName("triptype");
        // alert(trip);

        if (txt_orgval == "Origin Airport") {
            $('.origin_error').css({
                "border": "1px solid red",
            });
            return false;
        } else {
            $('.origin_error').css({
                "border": "1px solid #dfdfdf",
            });

        }
        if (txt_destval == "Destination Airport") {
            $('.destination_error').css({
                "border": "1px solid red",
            });
            return false;
        } else {
            $('.destination_error').css({
                "border": "1px solid #dfdfdf",
            });

        }

        if ($("#oneway").prop("checked")) {
            //alert('oneway');
            if (origin == '' || destination == '') {
                if (origin == '') {
                    $('.origin_error').css({
                        "border": "1px solid red",
                    });

                } else {
                    $('.origin_error').css({
                        "border": "1px solid #dfdfdf",
                    });

                }

                if (destination == '') {
                    $('.destination_error').css({
                        "border": "1px solid red",
                    });
                } else {
                    $('.destination_error').css({
                        "border": "1px solid #dfdfdf",
                    });
                }

                return false;
            }
            if (origin == '' && destination == '' && from == '') {

                $('.origin_error').css({
                    "border": "1px solid red",
                });
                $('.destination_error').css({
                    "border": "1px solid red",
                });
                $('.from_error').css({
                    "border": "1px solid red",
                });
                $('.to_error').css({
                    "border": "1px solid #dfdfdf",
                });

                return false;
            }
            else if (destination == '' && from == '') {
                $('.origin_error').css({
                    "border": "1px solid #dfdfdf",
                });
                $('.destination_error').css({
                    "border": "1px solid red",
                });
                $('.from_error').css({
                    "border": "1px solid red",
                });
                $('.to_error').css({
                    "border": "1px solid #dfdfdf",
                });
                return false;


            } else if (from == '') {
                $('.destination_error').css({
                    "border": "1px solid #dfdfdf",
                });

                $('.from_error').css({
                    "border": "1px solid red",
                });
                return false;

            }



            else {

                return true;
            }
        }
        if ($("#round").prop("checked")) {
            if (origin == '' || destination == '') {
                if (origin == '') {
                    $('.origin_error').css({
                        "border": "1px solid red",
                    });

                } else {
                    $('.origin_error').css({
                        "border": "1px solid #dfdfdf",
                    });

                }

                if (destination == '') {
                    $('.destination_error').css({
                        "border": "1px solid red",
                    });
                } else {
                    $('.destination_error').css({
                        "border": "1px solid #dfdfdf",
                    });
                }

                return false;
            }
            if (origin == '' && destination == '' && from == '' && to == '') {

                $('.origin_error').css({
                    "border": "1px solid red",
                });
                $('.destination_error').css({
                    "border": "1px solid red",
                });
                $('.from_error').css({
                    "border": "1px solid red",
                });
                $('.to_error').css({
                    "border": "1px solid red",
                });
                return false;
            } else if (destination == '' && from == '' && to == '') {
                $('.origin_error').css({
                    "border": "1px solid #dfdfdf",
                });
                $('.destination_error').css({
                    "border": "1px solid red",
                });
                $('.from_error').css({
                    "border": "1px solid red",
                });
                $('.to_error').css({
                    "border": "1px solid red",
                });

            } else if (from == '' && to == '') {
                $('.destination_error').css({
                    "border": "1px solid #dfdfdf",
                });

                $('.from_error').css({
                    "border": "1px solid red",
                });
                $('.to_error').css({
                    "border": "1px solid red",
                });

            }
            else if (to == '') {
                $('.destination_error').css({
                    "border": "1px solid #dfdfdf",
                });


                $('.from_error').css({
                    "border": "1px solid #dfdfdf",
                });
                $('.to_error').css({
                    "border": "1px solid red",
                });

            }

            else {

                return true;
            }
            if (from == '' || to == '') {
                $('.to_error').css({
                    "border": "1px solid red",
                });
                return false;
            }


        }



        if ($('#mysearchlist').text() == 'Not Found' || $('#mysearchlistdestination').text() == 'Not Found' || origin == destination) {

            $('.origin_error').css({
                "border": "1px solid red",
            });
            $('.destination_error').css({
                "border": "1px solid red",
            });
            return false;
        }
        else {

            if (origin == '' && destination == '' && from == '') {

                $('.origin_error').css({
                    "border": "1px solid red",
                });
                $('.destination_error').css({
                    "border": "1px solid red",
                });
                $('.from_error').css({
                    "border": "1px solid red",
                });
                return false;
            }
            else {

                return true;
            }
        }



    });



    $('.callpop').click(function () {
        $("#mycallbox").slideToggle();
    });


    $('.btnapplycodee').click(function () {

        if ($('.txt_couponn').val() == '') {
            $('.txt_couponn').css('border', '1px solid red');
        }
        else {

            //alert('hello');
            var value = $('.txt_couponn').val();
            $.ajax({
                method: 'POST',
                url: 'applucoupon',
                data: { name: value },
                success: function (response) {
                    //alert('hello');
                    // console.log(response); 
                    if (response == 400) {
                        $('.spbox').css('padding', '6px');
                        $('.spbox').css('background', '#dd3c10');
                        $('.spbox').css('text-align', 'center');
                        $('.spbox').css('border-radius', '6px');
                        $('.spbox').css('color ', '#fff');

                        $('.spbox').html('<i style="color:#fff;" class="fa fa-times" aria-hidden="true"></i> Invalid Coupon');
                        // $('.t2').show();
                    }
                    else {

                        //$('.coponbox').hide();

                        var dataResult = JSON.parse(response);
                        if (dataResult.value.coupontype == 'amt') {
                            var cfee = $('#totalPrice').val();
                            if (cfee < 200) {
                                $('.spbox').css('padding', '6px');
                                $('.spbox').css('font-size', '14px');
                                $('.spbox').css('background', '#dd3c10');
                                $('.spbox').css('text-align', 'center');
                                $('.spbox').css('border-radius', '6px');
                                $('.spbox').html('<i style="color:#fff;" class="fa fa-times" aria-hidden="true"></i> This coupon is only valid for fares above $200.');
                            } else {
                                //alert(cfee);
                                //  alert('hello');
                                $('.spbox').css('padding', '6px');
                                $('.spbox').css('background', '#57a01c');
                                $('.spbox').css('text-align', 'center');
                                $('.spbox').css('border-radius', '6px');
                                $('.spbox').html(' <i class="fa fa-check " aria-hidden="true"></i> ' + dataResult.value.couponname + ' coupon has been succesfully applied');
                                $('.mycouponper').text('$' + dataResult.value.couponpercent);
                                $('.coupon_value').val('$' + dataResult.value.couponpercent);
                                //var mybv=cfee*dataResult.value.couponpercent/100;
                                $('.mycoupondicount').text('- $' + dataResult.value.couponpercent);
                                $('.discount_value').val('- $' + dataResult.value.couponpercent);

                                $('.spbox').css('font-size', '14px');
                                $('.spbox').css('color ', '#fff');

                                $('#tprice').hide();
                                $('.crossamount').show();
                                $('.cross2').hide();
                                var price = $('#totalPrice').val();
                                var las = price - dataResult.value.couponpercent;
                                $('.ctp').text('USD ' + las.toFixed(2));
                                $('.final_total').val('USD ' + las.toFixed(2));
                                $('.hb').hide();
                                $('.cd').show();
                                $('.cd').val(las.toFixed(2));
                            }
                        } else {
                            var cfee = $('#totalPrice').val();
                            //alert(cfee);
                            $('.spbox').css('padding', '6px');
                            $('.spbox').css('background', '#57a01c');
                            $('.spbox').css('text-align', 'center');
                            $('.spbox').css('border-radius', '6px');
                            $('.spbox').css('font-size', '14px');
                            $('.spbox').css('color ', '#fff');
                            $('.spbox').html(' <i class="fa fa-check " aria-hidden="true"></i> ' + dataResult.value.couponname + ' coupon has been succesfully applied');
                            $('.mycouponper').text(dataResult.value.couponpercent + '%');
                            $('.coupon_value').val(dataResult.value.couponpercent + '%');
                            var mybv = cfee * dataResult.value.couponpercent / 100;
                            $('.mycoupondicount').text('- $' + mybv.toFixed(2));
                            $('.discount_value').val('- $' + mybv.toFixed(2));
                            $('.mycoupondicount').css('color', 'green');

                            $('#tprice').hide();
                            $('.crossamount').show();
                            $('.cross2').hide();
                            var price = $('#totalPrice').val();
                            var las = price - mybv;
                            $('.ctp').text('USD ' + las.toFixed(2));
                            $('.final_total').val('USD ' + las.toFixed(2));
                            $('.hb').hide();
                            $('.cd').show();
                            $('.cd').val(las.toFixed(2));
                        }
                    }
                }

            });



        }

    });

    if ($("#cookyGotItBtnBox").is(":visible")) {
        $('.bor-top').addClass('fooclasshid');
        $('#headnav').addClass('closeonclick');
        $('#mysearchlist').addClass('marginclass');
        $('#mysearchlistdestination').addClass('marginclass');
    } else {
        $('#headnav').removeClass('closeonclick');
        $('.bor-top').removeClass('fooclasshid');
        $('#mysearchlist').removeClass('marginclass');
        $('#mysearchlistdestination').removeClass('marginclass');
    }
});




// cookies law div footer show hide session store status
const cookyDisablePeriodInDays = 100;

function createCookie(cookieName, cookieValue, daysToExpire) {
    var date = new Date();
    date.setTime(date.getTime() + (daysToExpire * 24 * 60 * 60 * 1000));
    document.cookie = cookieName + "=" + cookieValue + "; expires=" + date.toGMTString();
}

function accessCookie(cookieName) {
    var name = cookieName + "=";
    var allCookieArray = document.cookie.split(';');
    for (var i = 0; i < allCookieArray.length; i++) {
        var temp = allCookieArray[i].trim();
        if (temp.indexOf(name) == 0)
            return temp.substring(name.length, temp.length);
    } return "";
}

// If user accept cooky policy by clicking `Got It` button then do not show the button to the user.
const cookyGotItStatus = accessCookie("cookyGotItButton");


if (cookyGotItStatus != "" && cookyGotItStatus == "hide") {
    $("#cookyGotItBtnBox").css("display", "none");
} else {
    setTimeout(function () {

        $("#cookyGotItBtnBox").css("display", "flex");
    }, 1000);
}

function cookyGotItBtn() {
    createCookie("cookyGotItButton", "hide", cookyDisablePeriodInDays);
    $('.bor-top').removeClass('fooclasshid');
    $("#cookyGotItBtnBox").css("display", "none");
    $('#headnav').removeClass('closeonclick');
    $('#mysearchlist').removeClass('marginclass');
    $('#mysearchlistdestination').removeClass('marginclass');


}



$(function () {

    var dateFormat = "mm/dd/yy",
        from = $("#fromclass")
            .datepicker({


                defaultDate: "+1w",

                minDate: 0,
                numberOfMonths: 2,
                onClose: function (dateText, inst) {
                    $("#toclass").focus();
                }
            })
            .on("change", function () {
                to.datepicker("option", "minDate", getDate(this));

            }),
        to = $("#toclass").datepicker({
            defaultDate: "+1w",

            numberOfMonths: 2
        })
            .on("change", function () {

                from.datepicker("option", "maxDate", getDate(this));

            });

});

let min_valu = '';

$(".scrolmain").hide();
$(".scrolmaind").hide();
$('#to').click(function () {
    $(".scrolmain").show();
});
$('.depdatefi').click(function () {



    var $dates = $('#from, #datepickerreturn').datepicker();
    $dates.datepicker('setDate', null);
    $("#from").datepicker("option", "maxDate", null);
    $('.scrolmain').hide();
    $('#from').datepicker().focus();

});

$('.resertdate').click(function () {
    var $dates = $('#from, #to').datepicker();
    $dates.datepicker('setDate', null);
    $("#from").datepicker("option", "maxDate", null);
    $('#to').hide();
    $("#from").show();
    $('.depclpop').val("");

    $('.arclpop').val("");
    //$( "#datepickerreturn" ).datepicker( "option", "maxDate", null);
    $dates.datepicker('refresh');




});
$('.confirmbtndate').click(function () {
    var d = $('.depdatefi').val();
    var dr = $('.retdatefi').val();
    $('#from').val(d);
    $('#to').val(dr);
    $('.scrolmain').hide();
});

$('.desktop_view_calaender').hide();

$('#depfield').click(function () {
    $('.desktop_view_calaender').fadeToggle(100);
    $("#fixcn").removeClass("show");
});

$('.calbtn').click(function () {
    $('.desktop_view_calaender').hide();
});
//     if (window.matchMedia('(max-width: 600px)').matches) {

//         $('.ui-datepicker-multi-4 .ui-datepicker-group').css('width','100%');
//         $( function() {
//             var dateFormat = "mm/dd/yy",
//               from = $( "#from")
//                 .datepicker({
//                  // defaultDate: dt,
//                   changeMonth: false,
//                   minDate:0,
//                   numberOfMonths: 12,
//                 //   onSelect: function() {
//                 // //     // Keep in mind that maybe the $(this) now reference to something else so you need to serach for the relvent Node
//                 // $("#ui-datepicker-div").find(".ui-state-active").removeClass("ui-state-active");

//                 //   },


//                 beforeShow:function(){

//                   var $dates = $('#from').datepicker();
//                   $dates.datepicker('setDate', null);
//                   $( "#from" ).datepicker( "option", "maxDate", null);
//                     $('.scrolmain').hide();
//                     var d = new Date();

// var month = d.getMonth()+1;
// var day = d.getDate();

// var output = d.getFullYear() + '/' +
//     (month<10 ? '0' : '') + month + '/' +
//     (day<10 ? '0' : '') + day;

//                     setTimeout(function(){
//                       $("#ui-datepicker-div").prepend("<div class='mainheaddate' style='position: fixed; z-index: 1;background:#fff;box-shadow:0 0 4px #ccc;width:100%;left:0;'><div class='deporg'><h4><i id='depclickclose' onclick='dpclose()' class='fa-solid fa-arrow-left'></i></h4> <i class='fa-sharp fa-solid fa-circle-xmark' onclick='dpclose()' style='position: absolute !important;z-index: 1;color: white;right: 17px;top: 13px;'></i></div><div class='thedatepickfield' style='    margin: 15px 12px 15px 12px;'><div class='row' style='margin: -30px auto 0;width:77%;display:flex;flex-wrap:nowrap !important;'><div style='width:100%;' class='col-sm-6'><input type='text' value='' class='depdatefi form-control' placeholder='Depature Date'/></div><div class='col-sm-6' style='width:100%;'><input type='text' class='retdatefi form-control' placeholder='Return Date'/></div></div></div></div><br/><br/><br/><br/><br/>"); 

//                     }, 10);
//                   },
//                     onClose: function(dateText, inst) {

//                         $("#datepickerreturn").datepicker(
//                             "change",
//                             { minDate: new Date(min_valu) }


//                     );


//                     $(".scrolmain").show();
//                 }


//                 })
//                 .on( "change", function(){
//                     $('#depdatefi').attr("id","newId");
//                     $('.depdatefi').val($('#from').val());
//                    // alert(getDate( this ));
//                     var dt=$(this).val();
//                     //alert(dt);

//                     min_valu=dt;
//                     var dt_to = $.datepicker.formatDate('mm/dd/y', new Date(dt));
//                    //alert(dt_to);
//                     $(this).val(dt_to);
//                   //to.datepicker( "option", "minDate", dt_to );
//                   const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

//                       const d = new Date(dt);
//                       let day = weekday[d.getDay()];
//                      // alert(dt_to);
//                      // alert(day);
//                     //  $("#ui-datepicker-div").find(".ui-state-active").removeClass("ui-state-active");
//                       $("#dp_date").text(day);

//                   $(this).addClass('active');
//                 })


//               to = $( "#datepickerreturn" ).datepicker({


//                // defaultDate: '05/27/2023',
//                // setDate:'05/27/2023',
//                  changeMonth: false,
//                 numberOfMonths: 12,

//               //  minDate:new Date(min_valu),
//                 beforeShowDay: function(date) {
//                    // console.log(new Date($('.depdatefi').val()).getTime());
//                     var d = date.getTime();

//                     if (new Date($('.depdatefi').val()) && d == new Date($('.depdatefi').val()).getTime()) {
//                       return [true, 'ui-red', ''];
//                     }
//                     if (new Date($('.depdatefi').val()) && $("#datepickerreturn").datepicker("getDate") && d < $("#datepickerreturn").datepicker("getDate").getTime() && d > new Date($('.depdatefi').val()).getTime()) {
//                       return [true, 'ui-state-highlight', ''];
//                     } else {
//                       return [true, '',''];
//                     }
//                   },
//                   onSelect: function(selectedDate) {
//                     $('#retdatefi').css('border', '2px solid red !important');

//                     jQuery('#retdatefi').attr("id","newId");
//                     var vvv=$.datepicker.formatDate('mm/dd/y', new Date($(this).val()));
//                     $('.retdatefi').val(vvv);
//                     $('#from').val(vvv);
//                     $('#from').datepicker('option', 'maxDate', $(this).datepicker('getDate')); // Reset maximum date              
//                    $("#ui-datepicker-div td").off();

//                   $(document).on("mouseenter", "#ui-datepicker-div td", function(e) {

//                         $(this).parent().addClass("finalRow");
//                         $(".finalRow").parents('.ui-datepicker-group-last').parent().find('.ui-datepicker-group-first').find('tr').last().addClass("finalRowRangeOtherTable");
//                         $(".finalRowRangeOtherTable").find("td:not(.ui-datepicker-unselectable)").addClass("highlight");
//                         $(".finalRowRangeOtherTable").prevAll().find("td:not(.ui-datepicker-unselectable)").addClass("highlight");

//                         $(".finalRow").prevAll().find("td:not(.ui-datepicker-unselectable)").addClass("highlight");
//                         $(this).prevAll("td:not(.ui-datepicker-unselectable)").addClass("highlight");
//                       });

//                       $("#ui-datepicker-div td").on("mouseleave", function() {

//                           $(this).parent().removeClass("finalRow");
//                           $("#ui-datepicker-div td").removeClass("highlight");

//                           $(".finalRowRange").removeClass("finalRowRange").find('.highlight').removeClass("highlight");
//                           $(".finalRowRangeOtherTable").removeClass("finalRowRangeOtherTable").find('.highlight').removeClass("highlight");

//                       });

//                 }


//               })

//               .on( "change", function(selectedDate) {
//              //  alert($(this).val());
//                var vvv=$.datepicker.formatDate('mm/dd/y', new Date($(this).val()));
//                     $('.retdatefi').val(vvv);
//                     $('#from').val(vvv);
//               $('#to').style.setProperty( 'display', 'inline', '!important');
//                from.datepicker( "option", "maxDate", getDate( this ) );
//                var dt=$(this).val();

//                    // alert(dt);
//                     var dt_to = $.datepicker.formatDate('mm/dd/y', new Date(dt));
//                   // alert(dt_to);
//                     $(this).val(dt_to);
//                   to.datepicker( "option", "minDate", dt_to );
//                   const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

//                       const d = new Date(dt);
//                       let day2 = weekday[d.getDay()];
//                     //  alert(dt_to);
//                     //  alert(day);

//                       $("#dr_date").text(day2);
//                      alert(day2);


//               });

//             function getDate( element ) {
//               var date;
//               try {
//                 date = $.datepicker.parseDate( dateFormat, element.value );
//               } catch( error ) {
//                 date = null;
//               }

//               return date;
//             }
//           } );
//       }else{
$("#to").hide();
$(function () {
    var dateFormat = "mm/dd/yy",
        from = $("#from")
            .datepicker({
                // defaultDate: dt,
                changeMonth: true,

                minDate: 0,
                numberOfMonths: 2,
                //   onSelect: function() {
                // //     // Keep in mind that maybe the $(this) now reference to something else so you need to serach for the relvent Node
                // $("#ui-datepicker-div").find(".ui-state-active").removeClass("ui-state-active");

                //   },

                beforeShow: function () {

                    var $dates = $('#from').datepicker();
                    $dates.datepicker('setDate', null);
                    $("#from").datepicker("option", "maxDate", null);
                    $('.scrolmain').hide();
                    var d = new Date();

                    var month = d.getMonth() + 1;
                    var day = d.getDate();

                    var output = d.getFullYear() + '/' +
                        (month < 10 ? '0' : '') + month + '/' +
                        (day < 10 ? '0' : '') + day;

                    setTimeout(function () {
                        $("#ui-datepicker-div").prepend("<div class='mainheaddate' style='position: fixed; z-index: 1;background:#fff;box-shadow:0 0 4px #ccc;width:100%;left:0;'><div class='deporg'><h4><i id='depclickclose' onclick='dpclose()' class='fa-solid fa-arrow-left'></i></h4> <i class='fa-sharp fa-solid fa-circle-xmark' onclick='dpclose()' style='position: absolute !important;z-index: 1;color: white;right: 17px;top: 13px;'></i></div><div class='thedatepickfield' style='    margin: 15px 12px 15px 12px;'><div class='row' style='margin: -30px auto 0;width:77%;display:flex;flex-wrap:nowrap !important;'><div style='width:100%;' class='col-sm-6'><input type='text' value='' class='depdatefi form-control' placeholder='Depature Date'/></div><div class='col-sm-6' style='width:100%;'><input type='text' class='retdatefi form-control' placeholder='Return Date'/></div></div></div></div><br/><br/><br/><br/><br/>");

                    }, 10);
                },

                onClose: function (dateText, inst) {

                    $("#to").datepicker(
                        "change",
                        { minDate: new Date(min_valu) }


                    );


                    // $("#to").focus();
                }

            })
            .on("change", function () {

                var dt = $(this).val();


                min_valu = dt;
                var dt_to = $.datepicker.formatDate('mm/dd/y', new Date(dt));
                // alert(dt_to);
                $('#depfield').val(dt_to);
                $('.depclpop').val(dt_to);
                to.datepicker("option", "minDate", getDate(this));
                const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

                const d = new Date(dt);
                let day = weekday[d.getDay()];
                // alert(dt_to);
                // alert(day);
                //  $("#ui-datepicker-div").find(".ui-state-active").removeClass("ui-state-active");
                $("#dp_date").text(day);
                $(".dp_date_air").val(day);
                $(this).addClass('active');

                if ($("#oneway").prop("checked")) {

                    to.hide();
                } else {
                    from.hide();
                    to.show();
                }
            })


    to = $("#to").datepicker({


        // defaultDate: '05/27/2023',
        // setDate:'05/27/2023',
        changeMonth: true,
        numberOfMonths: 2,
        //minDate:new Date(min_valu),

        beforeShowDay: function (date) {
            // alert('hello');
            //console.log(new Date($('.depclpop').val()).getTime());
            var d = date.getTime();

            if (new Date($('.depclpop').val()) && d == new Date($('.depclpop').val()).getTime()) {
                return [true, 'ui-red', ''];
            }
            if (new Date($('.depclpop').val()) && $("#to").datepicker("getDate") && d < $("#to").datepicker("getDate").getTime() && d > new Date($('.depclpop').val()).getTime()) {
                return [true, 'ui-state-highlight', ''];
            } else {
                return [true, '', ''];
            }
        },
        onSelect: function (selectedDate) {

            $('#retdatefi').css('border', '2px solid red !important');

            jQuery('#retdatefi').attr("id", "newId");
            var vvv = $.datepicker.formatDate('mm/dd/y', new Date($(this).val()));
            $('.retdatefi').val(vvv);
            $('#arrfield').val(vvv);
            $('.arclpop').val(vvv);
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            const d = new Date(vvv);
            let day2 = weekday[d.getDay()];
            // alert(dt_to);
            // alert(day2);

            $("#dr_date").text(day2);
            $(".ar_date_air").val(day2);

            $('.depclpop').datepicker('option', 'maxDate', $(this).datepicker('getDate')); // Reset maximum date                
            $("#ui-datepicker-div td").off();



            $(document).on("mouseenter", "#ui-datepicker-div td", function (e) {

                $(this).parent().addClass("finalRow");
                $(".finalRow").parents('.ui-datepicker-group-last').parent().find('.ui-datepicker-group-first').find('tr').last().addClass("finalRowRangeOtherTable");
                $(".finalRowRangeOtherTable").find("td:not(.ui-datepicker-unselectable)").addClass("highlight");
                $(".finalRowRangeOtherTable").prevAll().find("td:not(.ui-datepicker-unselectable)").addClass("highlight");

                $(".finalRow").prevAll().find("td:not(.ui-datepicker-unselectable)").addClass("highlight");
                $(this).prevAll("td:not(.ui-datepicker-unselectable)").addClass("highlight");
            });

            $("#ui-datepicker-div td").on("mouseleave", function () {

                $(this).parent().removeClass("finalRow");
                $("#ui-datepicker-div td").removeClass("highlight");

                $(".finalRowRange").removeClass("finalRowRange").find('.highlight').removeClass("highlight");
                $(".finalRowRangeOtherTable").removeClass("finalRowRangeOtherTable").find('.highlight').removeClass("highlight");

            });

        },



    })

        .on("change", function () {
            alert("jhehkej");
            // from.datepicker( "option", "maxDate", getDate( this ) );
            var vvv = $.datepicker.formatDate('mm/dd/y', new Date($(this).val()));

            from.datepicker("option", "maxDate", getDate(this));
            var dt = $(this).val();
            //alert(dt);
            var dt_to = $.datepicker.formatDate('mm/dd/y', new Date(dt));
            // alert(dt_to);
            $(this).val(dt_to);
            to.datepicker("option", "minDate", dt_to);
            //  to.datepicker( "option", "minDate", from );

            //  to.datepicker( "option", "minDate", dt_to );
            const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

            const d = new Date(dt);
            let day2 = weekday[d.getDay()];
            // alert(dt_to);
            console.log(day2);

            $("#dr_date").text(day2);
            $(".ar_date_air").val(day2);
        });

    function getDate(element) {
        var date;
        try {
            date = $.datepicker.parseDate(dateFormat, element.value);
        } catch (error) {
            date = null;
        }

        return date;
    }
});

function googleTranslateElementInit() {
    new google.translate.TranslateElement({ pageLanguage: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
}



$('#depclickclose').click(function () {
    $(".listsearchlist").hide();
});



function validateForm() {
    // This function deals with validation of the form fields
    var x, y, i, valid = true;
    x = document.getElementsByClassName("tab");
    y = x[currentTab].getElementsByTagName("input");
    // A loop that checks every input field in the current tab:
    for (i = 0; i < y.length; i++) {
        // If a field is empty...
        if (y[i].value == "") {
            // add an "invalid" class to the field:
            y[i].className += " invalid";
            // and set the current valid status to false
            valid = false;
        }
    }
    // If the valid status is true, mark the step as finished and valid:
    if (valid) {
        document.getElementsByClassName("step")[currentTab].className += " finish";
    }
    return valid; // return the valid status
}

function fixStepIndicator(n) {
    // This function removes the "active" class of all steps...
    var i, x = document.getElementsByClassName("step");
    for (i = 0; i < x.length; i++) {
        x[i].className = x[i].className.replace(" active", "");
    }
    //... and adds the "active" class on the current step:
    x[n].className += " active";
}



// $("#from").change(function(){
//     //alert("The text has been changed.");
//     var dt=$('#from').val();
//     alert(dt);
//    //$("#from").val($.format.date(new Date('dt'), 'dd M yy'));
//    var dt_to = $.datepicker.formatDate('mm/dd/y', new Date(dt));
//    //var d = new Date(dt);
//    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

//    const d = new Date(dt);
//    let day = weekday[d.getDay()];
//    alert(dt_to);
//    alert(day);

//    $("#dp_date").text(day);



//   });

// $( document ).ready(function() {
//     console.log( "ready!" );
//     var highlightDate = {};
//     highlightDate[ new Date('06/20/2023')] = new Date('06/20/2023');
//     highlightDate[ new Date('06/21/2023')] = new Date('06/21/2023');
//     highlightDate[ new Date('06/22/2023')] = new Date('06/22/2023');
//     highlightDate[ new Date('06/23/2023')] = new Date('06/23/2023');

//     $('#to').datepicker({
//         beforeShowDay: function( date ) {
//             var highlight = highlightDate[date];
//             if( highlight ) {
//                 return [true, "eventClass", 'Tooltip text'];
//             } else {
//                 return [true, '', ''];
//             }
//         }
//     });

// });

$("#exchange").click(function () {
    //  alert("The paragraph was clicked.");
    var tmp = document.getElementById("origin").value;
    document.getElementById("origin").value = document.getElementById("destination").value;
    document.getElementById("destination").value = tmp;
    var tmp2 = $("#check1").text();
    //alert(tmp2);
    $("#check1").text($("#check2").text());
    $("#check2").text(tmp2);
});
$("#exchange2").click(function () {
    //  alert("The paragraph was clicked.");
    var tmp = document.getElementById("origin2").value;
    document.getElementById("origin2").value = document.getElementById("destination2").value;
    document.getElementById("destination2").value = tmp;
    var tmp2 = $("#check1").text();
    //alert(tmp2);
    $("#check1").text($("#check2").text());
    $("#check2").text(tmp2);
});
$(".exchange2").click(function () {
    //  alert("The paragraph was clicked.");
    var tmp = document.getElementById("origin2").value;
    document.getElementById("origin2").value = document.getElementById("destination2").value;
    document.getElementById("destination2").value = tmp;
    var tmp2 = $("#check1").text();
    //alert(tmp2);
    $("#check1").text($("#check2").text());
    $("#check2").text(tmp2);
});
$('#blank1').click(function () {
    //alert('hjihj');
    $('.origin_value').val('');
    $('#check1').html('Origin Airport');

    $('#blank1').hide();
    //Some code
});
$('#blank2').click(function () {
    //alert('hjihj');
    $('.destination_value').val('');
    $('#check2').html('Destination Airport');
    $('#blank2').hide();
    //$('#blank1').hide();

    //Some code
});
$(document).ready(function () {
    console.log("ready!");
    $('#blank1').hide();
    $('#blank2').hide();

});

function dpclose() {
    // alert('hello');
    $('#from').datepicker("hide");
    $('#to').datepicker("hide");
}
function dpclose3() {
    //  alert('hello');

    $('.scrolmain').hide();
}
function dpclose1() {
    // alert('hello');
    $('.listsearchlist').hide();
    $('#origin2').val('');
};
function dpclose2() {
    // alert('hello');
    $('.listsearchlistdes').hide();
    $('#destination2').val('');
};


$('#arrowms').click(function () {
    //alert('hjihj');
    $('#destination').val('');
    $('#check2').html('Destination Airport');
    $('#blank2').hide();
    //$('#blank1').hide();

    //Some code
});
$('#blankoriginmobile').click(function () {
    alert('hello');

});
$('.cross12').click(function () {
    $('.couponpop').hide();
});
function copy12() {
    // Get the text field
    var copyText = document.getElementById("myInput");

    // Select the text field
    copyText.select();
    // copyText.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text inside the text field
    navigator.clipboard.writeText(copyText.value);
    $(".copytext").html("copied");
    $(".copytext").css("color", "green");
    $(".copy1").css("color", "green");


    // Alert the copied text
    // alert("Copied the text: " + copyText.value);
}




if (window.matchMedia('(max-width: 600px)').matches) {


    $('#oneway').click(function () {
        //alert('hjh');
        $('.to_error').hide();
        $('.search-smallinput').css('width', '100%');
        $('.res-mobiletxtview').css('display', 'block');

    });
    $('#round').click(function () {
        //alert('hjh');
        $('.res-mobiletxtview').css('display', 'flex');
        $('.search-smallinput').css('width', '100%');
        $('.to_error').show();

    });


    $(".deskres_pax input").attr('disabled', 'disabled');
    $(".deskres_pax select").attr('disabled', 'disabled');
    $('.deskres_pax input').removeAttr('id');

    // $('#txt_couponn').removeClass("txt_couponn");
    $('#destination2').attr('readonly', true);
    $('#origin2').attr('readonly', true);
    $('#txt_couponnmobile').addClass("txt_couponn");
    $(function () {
        $('#to').blur();
    });

} else {
    $('.mobres_pax input').removeAttr('name');
    $('#txt_couponnmobile').removeClass("txt_couponn");
}

function formatString(e) {





    //     const expdate = e;
    // const expDateFormatter = expdate.replace(/\//g, "").substring(0, 2) + 
    //   (expdate.length > 2 ? '/' : '') + 
    //   expdate.replace(/\//g, "").substring(2, 4);

    // console.log(expDateFormatter)

    // exit;
    var inputChar = String.fromCharCode(event.keyCode);
    var code = event.keyCode;

    var allowedKeys = [8];
    if (allowedKeys.indexOf(code) !== -1) {
        return;
    }

    event.target.value = event.target.value.replace(
        /^([1-9]\/|[2-9])$/g, '0$1/' // 3 > 03/
    ).replace(
        /^(0[1-9]|1[0-2])$/g, '$1/' // 11 > 11/
    ).replace(
        /^([0-1])([3-9])$/g, '0$1/$2' // 13 > 01/3
    ).replace(
        /^(0?[1-9]|1[0-2])([0-9]{2})$/g, '$1/$2' // 141 > 01/41
    ).replace(
        /^([0]+)\/|[0]+$/g, '0' // 0/ > 0 and 00 > 0
    ).replace(
        /[^\d\/]|^[\/]*$/g, '' // To allow only digits and `/`
    ).replace(
        /\/\//g, '/' // Prevent entering more than 1 `/`
    );
}




$('.origin_focus').click(function () {
    $('#origin2').focus();

});
$('.destination_focus').click(function () {
    // alert('hello');
    $('#destination2').focus();


});
$('.class').click(function () {
    //alert('hello');
    // alert($(this).val());

    $(".class_type_name").html($(this).val());
    $(".class_air").val($(this).val());

});

$('#tnc').click(function () {

    if ($('#tnc').prop('checked')) {
        $(".redcheck").css('color', '');
        //   alert('hello');
    } else {
        $(".redcheck").css('color', 'red');
    }

    //    }else{
    //     $(".agree").css('color','');
    //    }

});


$('#callbtn').click(function () {



    $(".redcheck").css('color', 'red');
    if ($('#tnc').prop('checked')) {
        $(".redcheck").css('color', '');
        //   alert('hello');
    }
    //   alert('hello');

    //    }else{
    //     $(".agree").css('color','');
    //    }

});







$(document).ready(function () {
    if ($("input:radio[name='yourRadioName']").is(":checked")) {
        //its checked
    }
});


$('#blank1').click(function () {
    //alert('hjihj');
    $('.origin_value').val('');
    $('#check1').html('Origin Airport');

    $('#blank1').hide();
    //Some code
});
$('#blank2').click(function () {
    //alert('hjihj');
    $('.destination_value').val('');
    $('#check2').html('Destination Airport');
    $('#blank2').hide();
    //$('#blank1').hide();

    //Some code
});
$(document).ready(function () {

    $('#blank1').hide();
    $('#blank2').hide();
    $("#to").datepicker('enable');

    $.ajax({
        type: 'GET',
        url: '/city',
        dataType: "json",


        success: function (data) {

            //const obj =    JSON.parse(data);
            // const myJSON = JSON.stringify(obj);
            console.log(data);
            // alert('hello');
            $('#origin2').val(data[0].code);
            $('.from_air').val(data[0].cityName + ', ' + data[0].countryName);
            $('#check1').html(data[0].cityName + ', ' + data[0].countryName);
            $("#blank1").show();



        }
    });




});

$('.btncommin ').click(function () {
    $('#pop').toggle();
});







$('.addshimmer').hide();
setTimeout(
    function () {
        $('.closeshine').hide();
        $('.addshimmer').css('display', 'block');
    }, 1000);

$("#closebvtn").click(function () {
    $('.overllllay').css('z-index', '-5');
    $('.overllllay').css('background', 'transparent');
    $("#onloadshowpop").hide();
});

$(function () {
    setTimeout(function () { $(".success_messages").fadeOut(1500); }, 5000)

})