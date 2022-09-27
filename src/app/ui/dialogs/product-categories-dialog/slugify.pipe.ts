/**
* Dayana Jabif
* Frontend Developer with 10+ years of experience. #Javascript #Angular #Ionic
* @ionicthemes @AngularTemplates
* Uruguay 
* dayana.jabif@gmail.com 
* https://www.linkedin.com/in/dayanajabif/
* Twitter: @dayujabif
* Github: djabif
*/
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'slugify'})
export class SlugifyPipe implements PipeTransform {
    transform(input: string): string {
      const trChars = {
        'áÁ': 'a',
        'éÉ': 'e',
        'íÍ': 'i',
        'óÓ': 'o',
        'úÚ': 'u',
        'ñÑ': 'n',
        'Аа': 'a',
        'Бб': 'b',
        'Вв': 'v',
        'Гг': 'g',
        'Дд': 'd',
        'Ее': 'e',
        'Жж': 'zh',
        'Зз': 'z',
        'Ии': 'i',
        'Йй': 'j',
        'Кк': 'k',
        'Лл': 'l',
        'Мм': 'm',
        'Нн': 'n',
        'Оо': 'o',
        'Пп': 'p',
        'Рр': 'r',
        'Сс': 's',
        'Тт': 't',
        'Уу': 'u',
        'Фф': 'f',
        'Хх': 'h',
        'Цц': 'c',
        'Чч': 'ch',
        'Шш': 'sh',
        'Щщ': 'sh',
        'Ыы': 'y',
        'Юю': 'ju',
        'Яя': 'ja',
      };
      for (const key of Object.keys(trChars)) {
        input = input.replace(new RegExp('[' + key + ']', 'g'), trChars[key]);
      }
      return input
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }
  }