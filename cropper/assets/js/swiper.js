
var swiper = new Swiper(".swiper-3d-7", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    centeredSlides: true,
    freeMode: true,
    watchSlidesProgress: true,
    effect: "coverflow",
    grabCursor: true,
    coverflowEffect: {
        rotate: 15,
        stretch: 90,
        depth: 0,
        modifier: 1,
        scale: 0.9,
        slideShadows: false,
    },
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: ".next-3d",
      prevEl: ".prev-3d",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        renderBullet: function (index, className) {
            return '<span class="' + className + '">' + (index + 1) + "</span>";
          },
    },
    breakpoints: {
        500: {
            slidesPerView: 2,
        },
        991: {
            slidesPerView: 3,
        },
        1024: {
            slidesPerView: 3,
        },
        1200: {
            slidesPerView: 4,
        },
        1400: {
            slidesPerView: 5,
        },
    },
});


var swiper = new Swiper(".slider-3d", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    centeredSlides: true,
    freeMode: true,
    watchSlidesProgress: true,
    effect: "coverflow",
    grabCursor: true,
    coverflowEffect: {
        rotate: 0,
        stretch: 90,
        depth: 0,
        modifier: 1,
        scale: 0.9,
        slideShadows: false,
    },
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: ".next-3d",
      prevEl: ".prev-3d",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        renderBullet: function (index, className) {
            return '<span class="' + className + '">' + (index + 1) + "</span>";
          },
    },
    breakpoints: {
        500: {
            slidesPerView: 2,
        },
        991: {
            slidesPerView: 3,
        },
        1024: {
            slidesPerView: 3,
        },
        1200: {
            slidesPerView: 4,
        },
        1400: {
            slidesPerView: 5,
        },
    },
});

var swiper = new Swiper(".swiper-3d-2card", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    centeredSlides: true,
    observer: true,
    observeParents: true,
    freeMode: false,
    watchSlidesProgress: true,
    effect: "coverflow",
    grabCursor: true,
    coverflowEffect: {
        rotate: 0,
        stretch: 440,
        depth: 0,
        modifier: 1,
        scale: 0.9,
        slideShadows: false,
    },
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
    },
    navigation: {
      prevEl: ".prev-3d",
    },
});
 
var swiper = new Swiper(".swiper-3d-3card", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    centeredSlides: true,
    observer: true,
    freeMode: false,
    watchSlidesProgress: true,
    effect: "coverflow",
    grabCursor: true,
    coverflowEffect: {
        rotate: 0,
        stretch: 500,
        depth: 0,
        modifier: 1,
        scale: 0.9,
        slideShadows: false,
    },
    autoplay: {
        delay: 2500,
        disableOnInteraction: false,
        waitForTransition: true
    },
    navigation: {
      prevEl: ".prev-3d",
    },
});

var swiper = new Swiper(".swiper-3d-3cardfull", {
    loop: true,
    spaceBetween: 0,
    slidesPerView: 1,
    centeredSlides: true,
    freeMode: true,
    watchSlidesProgress: true,
    effect: "coverflow",
    grabCursor: true,
    coverflowEffect: {
        rotate: 0,
        stretch: -20,
        depth: 0,
        modifier: 1,
        scale: 0.9,
        slideShadows: false,
    },
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    navigation: {
      nextEl: ".next-3d",
      prevEl: ".prev-3d",
    },
    breakpoints: {
        500: {
            slidesPerView: 2,
        },
        991: {
            slidesPerView: 3,
        },
    },
});

var swiper = new Swiper(".swiper-rotate-3", {
    loop: true,
    spaceBetween: 53,
    slidesPerView: 1,
    centeredSlides: true,
    freeMode: true,
    watchSlidesProgress: true,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    observer: true,
    observeParents: true,
    breakpoints: {
        500: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
});















var swiper =  new Swiper(".autoslider1", {
    spaceBetween: 28,
    grabCursor: true,
    speed: 10000,
    observer: true,
    observeParents: true,
    centeredSlides: false,
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
    breakpoints: {
            0: { 
            spaceBetween: 20,
            },
                480: { 
            spaceBetween: 20,
            },
                767: { 
                spaceBetween: 28,
            },
            992: {
                spaceBetween: 28,
            }
        },
    },
);

var swiper =  new Swiper(".autoslider2", {
    spaceBetween: 28,
    grabCursor: true,
    speed: 10000,
    centeredSlides: false,
    
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      reverseDirection: true,
      delay: 0,
      disableOnInteraction: false,
    },
    breakpoints: {
            0: { 
            spaceBetween: 20,
            },
                480: { 
            spaceBetween: 20,
            },
                767: { 
                spaceBetween: 28,
            },
            992: {
                spaceBetween: 28,
            }
        },
    },
);


var swiper =  new Swiper(".autoslider1reverse", {
    direction: 'vertical',
    spaceBetween: 45,
    grabCursor: false,
    speed: 10000,
    centeredSlides: false,
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
}
);

var swiper =  new Swiper(".autoslider2reverse", {
    direction: 'vertical',
    spaceBetween: 45,
    grabCursor: false,
    speed: 10000,
    centeredSlides: false,
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      reverseDirection: true,
    },
    },
);

var swiper =  new Swiper(".autoslider3reverse", {
    direction: 'vertical',
    spaceBetween: 14,
    grabCursor: false,
    observer: true,
    observeParents: true,
    speed: 10000,
    centeredSlides: false,
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
    },
}
);

var swiper =  new Swiper(".autoslider4reverse", {
    direction: 'vertical',
    spaceBetween: 14,
    grabCursor: false,
    observer: true,
    observeParents: true,
    speed: 10000,
    centeredSlides: false,
    loop: true,
    slidesPerView: 'auto',
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      reverseDirection: true,
    },
    },
);

var swiper =  new Swiper(".carousel", {
    loop:false,
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    spaceBetween: 30,
    navigation: {
        clickable: true,
        nextEl: ".slider-next",
        prevEl: ".slider-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1300: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
    },
});

var swiper =  new Swiper(".carouselfull", {
    loop:true,
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    spaceBetween: 30,
    centeredSlides: true,
    navigation: {
        clickable: true,
        nextEl: ".next-full",
        prevEl: ".prev-full",
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        1300: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
    },
});

var swiper =  new Swiper(".carouselfull-1", {
    loop:true,
    observer: true,
    observeParents: true,
    slidesPerView: 1,
    spaceBetween: 16,
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
        1300: {
            slidesPerView: 7,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carouselfull-2", {
    loop:true,
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    spaceBetween: 20,
    breakpoints: {
        768: {
            slidesPerView: 2,
            spaceBetween: 0,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carouselright", {
    loop:true,
    slidesPerView: 1,
    spaceBetween: 30,
    observer: true,
    observeParents: true,
    navigation: {
        clickable: true,
        nextEl: ".next-slide-right",
        prevEl: ".prev-slide-right",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction: false,
    },
    breakpoints: {
        700: {
            slidesPerView: "auto",
        },
    },
});

var swiper =  new Swiper(".carousel1", {
    loop:false,
    slidesPerView: 1,
    // observer: true,
    // observeParents: true,
    spaceBetween: 26.67,
    navigation: {
        clickable: true,
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        
        1300: {
            slidesPerView: 3,
        },
        1500: {
            slidesPerView: 4,
        },
    },
});

var swiper =  new Swiper(".carousel2", {
    loop:false,
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    spaceBetween: 26.67,
    navigation: {
        clickable: true,
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    breakpoints: {
        600: {
            slidesPerView: 2,
        },
        991: {
            slidesPerView: 3,
        },
        1024: {
            slidesPerView: 3,
        },
        1500: {
            slidesPerView: 4,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carousel3-type1", {
    loop:false,
    observer: true,
    observeParents: true,
    observer: true,
    observeParents: true,
    slidesPerView: 1,
    spaceBetween: 25,
    navigation: {
        clickable: true,
        nextEl: ".next-type1",
        prevEl: ".prev-type1",
    },
    pagination: {
        el: ".pagination-type1",
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carousel3-type2", {
    loop:true,
    observer: true,
    observeParents: true,
    slidesPerView: 1,
    spaceBetween: 12,
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carousel3", {
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    loop: false, 
    spaceBetween: 30,
    breakpoints: {
        600: {
            slidesPerView: 2,
            spaceBetween: 30,
        },
        991: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".carousel5", {
    loop:false,
    observer: true,
    observeParents: true,
    slidesPerView: 1,
    spaceBetween: 30,
    navigation: {
        clickable: true,
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    breakpoints: {
        600: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
        1440: {
            slidesPerView: 4,
        },
        1500: {
            slidesPerView: 5,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".seller-slider3", {
    slidesPerView: 1,
    observer: true,
    observeParents: true,
    loop: false, 
    spaceBetween: 45,
    navigation: {
        clickable: true,
        nextEl: ".seller-next",
        prevEl: ".seller-prev",
    },
    grabCursor: true,
    breakpoints: {
        500: {
            slidesPerView: 3,
        },
        640: {
            slidesPerView: 4,
        },
        769: {
            slidesPerView: 5,
        },
        1440: {
            slidesPerView: 6,
        },
        1500: {
            slidesPerView: 7,
        },
    },
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

var swiper =  new Swiper(".seller-slider2", {
    slidesPerView: 2,
    loop: true, 
    observer: true,
    observeParents: true,
    spaceBetween: 30,
    navigation: {
        clickable: true,
        nextEl: ".seller-next",
        prevEl: ".seller-prev",
    },
    grabCursor: true,
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
    breakpoints: {
        500: {
            slidesPerView: 3,
            spaceBetween: 30,
        },
        640: {
            slidesPerView: 4,
            spaceBetween: 30,
        },
        768: {
            slidesPerView: 5,
            spaceBetween: 30,
        },
        1070: {
            slidesPerView: 6,
            spaceBetween: 30,
        },
    },
});

var swiper =  new Swiper(".seller-slider", {
    slidesPerView: 1,
    loop: false, 
    observer: true,
    observeParents: true,
    spaceBetween: 30,
    navigation: {
        clickable: true,
        nextEl: ".main-next",
        prevEl: ".main-prev",
    },
    grabCursor: true,
    autoplay: {
        delay: 2000,
        disableOnInteraction:false,
    },
});

