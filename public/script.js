console.log("Работает?");


window.onload = function() {

    console.log("Работает?");





    document.getElementById("firstCreatedFile").classList.add("active");
    let button = document.getElementById('buttonCreateFile');
    console.log(button);
    let countFiles = 2;

    button.addEventListener("click", createNewElement);
    function createNewElement() {
        console.log(countFiles);
        if (countFiles < 11)
        {
            let newP = document.createElement("div");
            let activeButton = document.querySelector("#files .active");
            activeButton.classList.remove("active");
            newP.setAttribute("id", "createdFile");
            newP.setAttribute("class", "new-element-class")
            newP.classList.add("active");
            newP.innerHTML = `<p>file${countFiles}.cs</p>`;
            newP.addEventListener("click", function(){
                let activeButton = document.querySelector(".active");
                activeButton.classList.remove("active");
                this.classList.add("active");
            });
            let parentNode = document.getElementById("files");
            parentNode.appendChild(newP);
            countFiles++;
        }
    }

    let firstCreatedFile = document.getElementById("firstCreatedFile");
    firstCreatedFile.addEventListener("click", function() {
        let activeButton = document.querySelector("#files .active");
        activeButton.classList.remove("active");
        firstCreatedFile.classList.add("active");
    })








}




