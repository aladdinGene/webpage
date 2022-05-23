from django.shortcuts import render, get_object_or_404, redirect
from django.views import View
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import os.path
from PIL import Image


class IndexView(View):
    template_name = 'index.html'

    def get(self, request):
        categories = ['Category1', 'Category2', 'Category3', 'Category4',
                      'Category5', 'Category6', 'Category7', 'Category8', 'Category9']
        options = ['Option1', 'Option2', 'Option3', 'Option4',
                   'Option5', 'Option6', 'Option7', 'Option8', 'Option9']

        return render(request, self.template_name, {"categories": categories, "options": options})
