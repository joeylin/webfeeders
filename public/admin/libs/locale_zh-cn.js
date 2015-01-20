'use strict';
/*global angular*/

angular.module('wf.locale', ['ngLocale']).
run(['$locale',
    function ($locale) {
        angular.extend($locale, {
            DATETIME: {
                second: '秒',
                minute: '分',
                hour: '时',
                day: '天',
                month: '月',
                year: '年',
                fullD: 'yyyy年MM月dd日 HH:mm',
                shortD: 'MM-dd HH:mm',
                dayAgo: '天前',
                hourAgo: '小时前',
                minuteAgo: '分钟前',
                secondAgo: '刚刚'
            },
            UPLOAD: {
                fileType: '文件类型无效，仅允许png、gif、jpg文件！'
            }
        });
    }
]);