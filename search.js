 var searo = document.getElementById("searo");
 var sear = document.getElementById("sear");
 
 
  function myFunction() {
  var input = document.getElementById("myInput");
var   filter = input.value.toUpperCase();
var  table = document.getElementById("myTable");
var  tr = document.getElementsByTagName("tr");

  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
        searo.style.display = "";
        sear.style.display = "";
      } else {
        tr[i].style.display = "none";
        searo.style.display = "block";
        sear.style.display = "block";
      }
    }       
  }
}
