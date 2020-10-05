projectNameInp.oninput = projectNameInp.onchange = createBtn.onclick = e => {
  const projectName = projectNameInp.value
  let err

  if (projectName.length < 3 || projectName.length > 30) {
    err = `Название проекта должно содержать от 3 до 30 символов.`
  } else if (projectName.includes(" ")) {
    err = `В названии проекта используются недопустимые символы.`
  }

  if (err) {
    if (e.target == createBtn) {
      new Alert("danger", err).show()
    } else {
      createBtn.className = `ml-2 btn btn-danger`
    }
  } else {
    if (e.target == createBtn) {
      fetch("/api/check-project-name", {
        method: "POST",
        body: JSON.stringify({ projectName })
      }).then(resp => resp.json()).then(data => {
        if (data.checked) {
          const html = htmlTA.value
          const css = cssTA.value
          const js = jsTA.value

          fetch("/api/add", {
            method: "POST",
            body: JSON.stringify({ projectName, html, css, js })
          }).then(resp => resp.json()).then(data => {
            if (data.success) {
              new Alert("success", `Проект успешно создан!`).show()
              createBtn.className = `ml-2 btn btn-success`
              setTimeout(() => {

              }, 1200)
            } else {
              new Alert("danger", data.msg).show()
              createBtn.className = `ml-2 btn btn-danger`
            }
          })
        } else {
          new Alert("danger", `Такое имя проекта уже занято. Попробуйте другое.`).show()
          createBtn.className = `ml-2 btn btn-danger`
        }
      })
    } else {
      createBtn.className = `ml-2 btn btn-success`
    }
  }
}