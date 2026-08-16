let currentLanguage = "ar";


function toggleLanguage(){

    currentLanguage =
        currentLanguage === "ar"
            ? "en"
            : "ar";

    document.documentElement.lang =
        currentLanguage;

    document.documentElement.dir =
        currentLanguage === "ar"
            ? "rtl"
            : "ltr";


    document
        .querySelectorAll("[data-ar][data-en]")
        .forEach(element => {

            element.textContent =
                element.getAttribute(
                    currentLanguage === "ar"
                        ? "data-ar"
                        : "data-en"
                );

        });


    document
        .querySelectorAll(
            "[data-placeholder-ar][data-placeholder-en]"
        )
        .forEach(element => {

            element.placeholder =
                element.getAttribute(
                    currentLanguage === "ar"
                        ? "data-placeholder-ar"
                        : "data-placeholder-en"
                );

        });


    const languageButton =
        document.querySelector(".language-btn");

    if(languageButton){

        languageButton.textContent =
            currentLanguage === "ar"
                ? "🌐 English"
                : "🌐 العربية";

    }


    localStorage.setItem(
        "portalLanguage",
        currentLanguage
    );

}


function applySavedLanguage(){

    const saved =
        localStorage.getItem("portalLanguage");

    if(saved === "en"){

        toggleLanguage();

    }

}


function searchPortal(){

    const input =
        document.getElementById("searchInput");

    const result =
        document.getElementById("searchResult");

    const query =
        input.value.trim();


    if(query === ""){

        result.innerHTML =
            currentLanguage === "ar"
                ? "<span style='color:#c62828;'>الرجاء كتابة كلمة للبحث.</span>"
                : "<span style='color:#c62828;'>Please enter a search term.</span>";

        return;

    }


    result.innerHTML =
        currentLanguage === "ar"
            ? "<span style='color:#287a35;'>يتم البحث عن: <strong>" +
              query +
              "</strong></span>"
            : "<span style='color:#287a35;'>Searching for: <strong>" +
              query +
              "</strong></span>";

}


function showComingSoon(){

    alert(
        currentLanguage === "ar"
            ? "هذه الخدمة سيتم تفعيلها في الخطوات القادمة."
            : "This service will be activated in the next development phase."
    );

}


function openSmartScreening(){

    window.location.href =
        "smart-screening.html";

}


function openOccupationalHealth(){

    window.location.href =
        "occupational-health.html";

}


window.addEventListener(
    "DOMContentLoaded",
    applySavedLanguage
);