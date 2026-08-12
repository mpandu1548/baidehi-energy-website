from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("about/", views.about, name="about"),
    path("chairman/", views.chairman, name="chairman"),
    path("project/", views.project, name="project"),
    path("gallery/", views.gallery, name="gallery"),
    path("team/", views.team, name="team"),
    path("news/", views.news, name="news"),
    path("contact/", views.contact, name="contact"),
]